# One-time setup for this backend

Run these once (from your own terminal, not this repo's code) before the
first `firebase deploy --only functions`.

## 1. Create a dedicated database user

Not the `postgres` superuser - a scoped app user, same idea as any other
app-specific DB credential.

```
gcloud sql users create bingely_app \
  --instance=bingely-fdc \
  --project=bingely-85e31 \
  --password='<pick a strong password>'
```

## 2. Confirm the instance connection name

Should match `bingely-85e31:us-east1:bingely-fdc` (already hardcoded in
`src/index.ts`) - double check with:

```
gcloud sql instances describe bingely-fdc \
  --project=bingely-85e31 \
  --format='value(connectionName)'
```

If it differs, update `INSTANCE_CONNECTION_NAME` in `src/index.ts`.

## 3. Create the tables

Connect interactively and run the DDL below:

```
gcloud sql connect bingely-fdc --user=bingely_app --database=fdcdb --project=bingely-85e31
```

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  username_lower VARCHAR(50) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_username_lower ON users (username_lower);

CREATE TABLE rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id),
  movie_id INTEGER NOT NULL,
  media_type VARCHAR(10) NOT NULL,
  title TEXT NOT NULL,
  poster_path TEXT,
  genre_ids INTEGER[],
  score INTEGER NOT NULL,
  ranked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, movie_id, media_type)
);
CREATE INDEX idx_rankings_user_score ON rankings (user_id, score DESC);

CREATE TABLE follows (
  follower_id TEXT NOT NULL REFERENCES users(id),
  followee_id TEXT NOT NULL REFERENCES users(id),
  followed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followee_id)
);
```

## 4. Store the password as a deployed secret (not in any committed file)

```
firebase functions:secrets:set DB_PASSWORD --project=bingely-85e31
```
(pastes/prompts for the same password from step 1).

## 5. Deploy

```
firebase deploy --only functions
```

Note the URL it prints (looks like
`https://api-<hash>-<region-code>.a.run.app` or
`https://us-east1-bingely-85e31.cloudfunctions.net/api`) - that goes into
`src/services/postgresApi.ts`'s `API_BASE_URL`.
