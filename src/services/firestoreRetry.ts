import { FirestoreError } from 'firebase/firestore';

/**
 * Firestore's one-shot getDoc/getDocs reads can reject with a synthetic
 * "Failed to get document because the client is offline" error (code:
 * "unavailable") on the very first read after the app launches or reloads -
 * before its watch stream has confirmed connectivity, the SDK's internal
 * online/offline tracking defaults to offline and getDoc/getDocs fail fast
 * instead of waiting for the real network request. This has nothing to do
 * with actual connectivity, and the SDK's own source comments confirm
 * "unavailable" is meant to be retried by the caller. onSnapshot listeners
 * don't hit this because they keep retrying on their own; one-shot reads
 * need to do that themselves, which is what this wrapper does.
 */
export async function withOfflineRetry<T>(
  read: () => Promise<T>,
  attempts = 3,
  delayMs = 600,
): Promise<T> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await read();
    } catch (error) {
      const isLastAttempt = attempt === attempts - 1;
      const isTransient = (error as FirestoreError)?.code === 'unavailable';
      if (isLastAttempt || !isTransient) {
        throw error;
      }
      await new Promise<void>(resolve => setTimeout(resolve, delayMs));
    }
  }
  // Unreachable - the loop above always either returns or throws - but
  // keeps TypeScript happy about a guaranteed return type.
  throw new Error('withOfflineRetry: exhausted retries without a result');
}
