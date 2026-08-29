import { auth } from './firebase';

// The backend for rankings/profiles/follows: a Cloud Function (Express app,
// see functions/src/index.ts) in front of the Postgres instance that
// replaced Firestore for this data. Much simpler than the SQL Connect
// client it replaces (src/services/dataConnect.ts, removed) since this is
// our own documented API rather than a reverse-engineered external one.
//
const API_BASE_URL = 'https://us-east1-bingely-85e31.cloudfunctions.net/api';

export class PostgresApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'PostgresApiError';
  }
}

async function request<T>(
  method: 'GET' | 'PUT' | 'POST' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) {
    throw new PostgresApiError('Must be signed in to call the API.');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 204) {
    return undefined as T;
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new PostgresApiError(`Non-JSON response (status ${response.status}).`, response.status);
  }

  if (!response.ok) {
    const message =
      typeof json === 'object' && json && 'error' in json
        ? String((json as { error: unknown }).error)
        : `Request failed (${response.status}).`;
    throw new PostgresApiError(message, response.status);
  }

  return json as T;
}

export const postgresApi = {
  get: <T>(path: string) => request<T>('GET', path),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, body),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
