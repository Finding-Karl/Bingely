import { FIREBASE_API_KEY, FIREBASE_PROJECT_ID } from '@env';
import { auth } from './firebase';

// --- Proof-of-concept: talking to Firebase SQL Connect (formerly Data
// Connect) directly from React Native. ---
//
// SQL Connect ships official client SDKs for Web, iOS, Android, and Flutter
// only - there is no React Native SDK, and the raw HTTP contract isn't
// published in the public docs. This module replicates the exact request
// the official Web SDK (`@firebase/data-connect`) makes under the hood,
// reverse-engineered from that package's published source
// (node_modules/@firebase/data-connect/dist/index.cjs.js - see
// `restUrlBuilder`, `dcFetch`, and `addToken`). If SQL Connect ever ships a
// documented public REST contract, prefer that over this.
//
// These three IDs come from dataconnect/dataconnect.yaml (serviceId,
// location) and dataconnect/example/connector.yaml (connectorId) - update
// them here if the schema is ever moved to a different service/connector.
const LOCATION = 'us-east1';
const SERVICE_ID = 'bingely';
const CONNECTOR_ID = 'example';

const CONNECTOR_RESOURCE_NAME = `projects/${FIREBASE_PROJECT_ID}/locations/${LOCATION}/services/${SERVICE_ID}/connectors/${CONNECTOR_ID}`;
const ENDPOINT_BASE = `https://firebasedataconnect.googleapis.com/v1/${CONNECTOR_RESOURCE_NAME}`;

export class DataConnectRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataConnectRequestError';
  }
}

async function execute<T>(
  kind: 'executeQuery' | 'executeMutation',
  operationName: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) {
    throw new DataConnectRequestError('Must be signed in to call a SQL Connect operation.');
  }

  const url = `${ENDPOINT_BASE}:${kind}?key=${FIREBASE_API_KEY}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // This custom header - not a standard `Authorization: Bearer` - is
      // what the Web SDK actually sends the Firebase Auth ID token as.
      'X-Firebase-Auth-Token': idToken,
    },
    body: JSON.stringify({
      name: CONNECTOR_RESOURCE_NAME,
      operationName,
      variables,
    }),
  });

  let json: any;
  try {
    json = await response.json();
  } catch {
    throw new DataConnectRequestError(
      `SQL Connect returned a non-JSON response (status ${response.status}).`,
    );
  }

  if (!response.ok) {
    throw new DataConnectRequestError(
      `SQL Connect request failed (${response.status}): ${json?.message ?? JSON.stringify(json)}`,
    );
  }
  if (json.errors?.length) {
    throw new DataConnectRequestError(`SQL Connect operation error: ${JSON.stringify(json.errors)}`);
  }
  return json.data as T;
}

export function executeDataConnectQuery<T = unknown>(
  operationName: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  return execute<T>('executeQuery', operationName, variables);
}

export function executeDataConnectMutation<T = unknown>(
  operationName: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  return execute<T>('executeMutation', operationName, variables);
}
