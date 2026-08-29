import { Connector, IpAddressTypes } from '@google-cloud/cloud-sql-connector';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import express, { NextFunction, Request, Response } from 'express';
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { Pool } from 'pg';

// --- Postgres connection ---
//
// This replaces Firebase SQL Connect, whose own schema-migration tooling is
// broken for this project (404 on an internal experimental endpoint - see
// the commit that introduced this file for the full story). Same Cloud SQL
// instance SQL Connect provisioned (bingely-fdc/fdcdb); we just talk to it
// directly with a standard Postgres client instead of going through SQL
// Connect's GraphQL layer.
//
// A dedicated `bingely_app` database user (not the `postgres` superuser)
// should already exist - see the plan this session followed for the
// `gcloud sql users create` command. Its password is a deployed secret, not
// a committed value.
const INSTANCE_CONNECTION_NAME = 'bingely-85e31:us-east1:bingely-fdc';
const DB_USER = 'bingely_app';
const DB_NAME = 'fdcdb';

const dbPassword = defineSecret('DB_PASSWORD');

let poolPromise: Promise<Pool> | undefined;

/**
 * Lazily creates (and caches) the connection pool. Cloud Functions/Cloud Run
 * instances are reused across invocations while warm, so initializing this
 * once at first use - rather than per-request - avoids reconnecting to
 * Cloud SQL on every call.
 */
function getPool(): Promise<Pool> {
  if (!poolPromise) {
    poolPromise = (async () => {
      const connector = new Connector();
      const clientOpts = await connector.getOptions({
        instanceConnectionName: INSTANCE_CONNECTION_NAME,
        ipType: IpAddressTypes.PUBLIC,
      });
      return new Pool({
        ...clientOpts,
        user: DB_USER,
        password: dbPassword.value(),
        database: DB_NAME,
        max: 5,
      });
    })();
  }
  return poolPromise;
}

// --- Auth ---
//
// Every route requires a signed-in Firebase Auth user. The client sends the
// user's Firebase ID token as a standard `Authorization: Bearer <token>`
// header (see src/services/postgresApi.ts on the app side); we verify it
// with the Admin SDK and trust only the uid that comes out of that
// verification - never a client-supplied uid - for anything scoped to "the
// signed-in user".
initializeApp();

interface AuthedRequest extends Request {
  uid?: string;
}

async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.header('Authorization') ?? '';
  const match = /^Bearer (.+)$/.exec(header);
  if (!match) {
    res.status(401).json({ error: 'Missing Authorization: Bearer <Firebase ID token> header.' });
    return;
  }
  try {
    const decoded = await getAuth().verifyIdToken(match[1]);
    req.uid = decoded.uid;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired ID token.' });
  }
}

function asyncRoute(
  handler: (req: AuthedRequest, res: Response) => Promise<void>,
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    handler(req as AuthedRequest, res).catch(next);
  };
}

// --- App ---

const app = express();
app.use(express.json());
app.use(requireAuth as express.RequestHandler);

// GET /profile/me
app.get(
  '/profile/me',
  asyncRoute(async (req, res) => {
    const pool = await getPool();
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.uid]);
    res.json(rows[0] ?? null);
  }),
);

// PUT /profile/me { username, usernameLower, displayName, email }
app.put(
  '/profile/me',
  asyncRoute(async (req, res) => {
    const { username, usernameLower, displayName, email } = req.body ?? {};
    if (!username || !usernameLower || !displayName || !email) {
      res.status(400).json({ error: 'username, usernameLower, displayName, and email are required.' });
      return;
    }
    const pool = await getPool();
    const { rows } = await pool.query(
      `INSERT INTO users (id, username, username_lower, display_name, email)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         username = EXCLUDED.username,
         username_lower = EXCLUDED.username_lower,
         display_name = EXCLUDED.display_name,
         email = EXCLUDED.email
       RETURNING *`,
      [req.uid, username, usernameLower, displayName, email],
    );
    res.json(rows[0]);
  }),
);

// GET /rankings/mine
app.get(
  '/rankings/mine',
  asyncRoute(async (req, res) => {
    const pool = await getPool();
    const { rows } = await pool.query(
      'SELECT * FROM rankings WHERE user_id = $1 ORDER BY score DESC',
      [req.uid],
    );
    res.json(rows);
  }),
);

// GET /rankings/user/:uid - read-only view of another user's rankings
// (FriendProfileScreen). Any signed-in user may read any other user's
// rankings, same as the original Firestore rules allowed.
app.get(
  '/rankings/user/:uid',
  asyncRoute(async (req, res) => {
    const pool = await getPool();
    const { rows } = await pool.query(
      'SELECT * FROM rankings WHERE user_id = $1 ORDER BY score DESC',
      [req.params.uid],
    );
    res.json(rows);
  }),
);

// GET /rankings/count/:uid - used by the leaderboard, once per followed
// friend plus once for self.
app.get(
  '/rankings/count/:uid',
  asyncRoute(async (req, res) => {
    const pool = await getPool();
    const { rows } = await pool.query(
      'SELECT COUNT(*)::int AS count FROM rankings WHERE user_id = $1',
      [req.params.uid],
    );
    res.json({ count: rows[0].count });
  }),
);

// GET /rankings/mine/:mediaType/:movieId - prefill for MovieDetailScreen
app.get(
  '/rankings/mine/:mediaType/:movieId',
  asyncRoute(async (req, res) => {
    const movieId = Number(req.params.movieId);
    const pool = await getPool();
    const { rows } = await pool.query(
      'SELECT * FROM rankings WHERE user_id = $1 AND media_type = $2 AND movie_id = $3',
      [req.uid, req.params.mediaType, movieId],
    );
    res.json(rows[0] ?? null);
  }),
);

const MAX_REVIEW_LENGTH = 2000;

// PUT /rankings { movieId, mediaType, title, posterPath, genreIds, score, review }
app.put(
  '/rankings',
  asyncRoute(async (req, res) => {
    const { movieId, mediaType, title, posterPath, genreIds, score, review } = req.body ?? {};
    if (movieId === undefined || !mediaType || !title || score === undefined) {
      res.status(400).json({ error: 'movieId, mediaType, title, and score are required.' });
      return;
    }
    // The client's rating slider already snaps to tenths, but round again
    // here rather than trust the network payload - defends against both
    // client float drift (e.g. 7.199999999999999) and a caller that isn't
    // the app's own slider. score column is NUMERIC(3,1); anything outside
    // 1.0-10.0 is rejected rather than silently clamped.
    const roundedScore = Math.round(Number(score) * 10) / 10;
    if (!Number.isFinite(roundedScore) || roundedScore < 1 || roundedScore > 10) {
      res.status(400).json({ error: 'score must be a number between 1.0 and 10.0.' });
      return;
    }
    // review is optional - empty string/undefined/null all mean "no review",
    // stored as NULL rather than an empty string so it's unambiguous
    // whether a user has written one (see RankingRow's "has a review" check).
    let reviewToSave: string | null = null;
    if (typeof review === 'string' && review.trim()) {
      if (review.length > MAX_REVIEW_LENGTH) {
        res.status(400).json({ error: `review must be ${MAX_REVIEW_LENGTH} characters or fewer.` });
        return;
      }
      reviewToSave = review.trim();
    }
    const pool = await getPool();
    const { rows } = await pool.query(
      `INSERT INTO rankings (user_id, movie_id, media_type, title, poster_path, genre_ids, score, review)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (user_id, movie_id, media_type) DO UPDATE SET
         title = EXCLUDED.title,
         poster_path = EXCLUDED.poster_path,
         genre_ids = EXCLUDED.genre_ids,
         score = EXCLUDED.score,
         review = EXCLUDED.review,
         ranked_at = now()
       RETURNING *`,
      [req.uid, movieId, mediaType, title, posterPath ?? null, genreIds ?? null, roundedScore, reviewToSave],
    );
    res.json(rows[0]);
  }),
);

// DELETE /rankings/mine/:mediaType/:movieId - remove a title from the
// caller's own list (swipe-to-delete on the Dashboard).
app.delete(
  '/rankings/mine/:mediaType/:movieId',
  asyncRoute(async (req, res) => {
    const movieId = Number(req.params.movieId);
    const pool = await getPool();
    await pool.query(
      'DELETE FROM rankings WHERE user_id = $1 AND media_type = $2 AND movie_id = $3',
      [req.uid, req.params.mediaType, movieId],
    );
    res.status(204).send();
  }),
);

// GET /social/search?term=... - genuine prefix match on username_lower
// (Firestore's version faked this with a range query; Postgres just does
// it directly).
app.get(
  '/social/search',
  asyncRoute(async (req, res) => {
    const term = String(req.query.term ?? '').trim().toLowerCase();
    if (!term) {
      res.json([]);
      return;
    }
    const pool = await getPool();
    const { rows } = await pool.query(
      `SELECT * FROM users
       WHERE username_lower LIKE $1 || '%' AND id != $2
       ORDER BY username_lower
       LIMIT 20`,
      [term, req.uid],
    );
    res.json(rows);
  }),
);

// POST /social/follow { followeeId }
app.post(
  '/social/follow',
  asyncRoute(async (req, res) => {
    const { followeeId } = req.body ?? {};
    if (!followeeId) {
      res.status(400).json({ error: 'followeeId is required.' });
      return;
    }
    const pool = await getPool();
    await pool.query(
      'INSERT INTO follows (follower_id, followee_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.uid, followeeId],
    );
    res.status(204).send();
  }),
);

// DELETE /social/follow/:followeeId
app.delete(
  '/social/follow/:followeeId',
  asyncRoute(async (req, res) => {
    const pool = await getPool();
    await pool.query('DELETE FROM follows WHERE follower_id = $1 AND followee_id = $2', [
      req.uid,
      req.params.followeeId,
    ]);
    res.status(204).send();
  }),
);

// GET /social/following
app.get(
  '/social/following',
  asyncRoute(async (req, res) => {
    const pool = await getPool();
    const { rows } = await pool.query(
      `SELECT u.id AS uid, u.username, u.display_name, f.followed_at
       FROM follows f
       JOIN users u ON u.id = f.followee_id
       WHERE f.follower_id = $1
       ORDER BY f.followed_at DESC`,
      [req.uid],
    );
    res.json(rows);
  }),
);

// Central error handler - anything an asyncRoute handler throws (a failed
// query, etc.) lands here instead of hanging the request.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal error.' });
});

export const api = onRequest({ region: 'us-east1', secrets: [dbPassword] }, app);
