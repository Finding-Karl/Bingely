import { FirestoreError } from 'firebase/firestore';
import { withOfflineRetry } from './firestoreRetry';

function makeUnavailableError(): FirestoreError {
  const error = new Error('Failed to get document because the client is offline.');
  return Object.assign(error, { code: 'unavailable' }) as FirestoreError;
}

describe('withOfflineRetry', () => {
  it('returns the result on the first success without retrying', async () => {
    const read = jest.fn().mockResolvedValue('ok');
    await expect(withOfflineRetry(read)).resolves.toBe('ok');
    expect(read).toHaveBeenCalledTimes(1);
  });

  it('retries on a transient "unavailable" error and returns the eventual result', async () => {
    const read = jest
      .fn()
      .mockRejectedValueOnce(makeUnavailableError())
      .mockRejectedValueOnce(makeUnavailableError())
      .mockResolvedValueOnce('ok');
    await expect(withOfflineRetry(read, 3, 0)).resolves.toBe('ok');
    expect(read).toHaveBeenCalledTimes(3);
  });

  it('gives up and throws after exhausting all attempts', async () => {
    const read = jest.fn().mockRejectedValue(makeUnavailableError());
    await expect(withOfflineRetry(read, 2, 0)).rejects.toMatchObject({ code: 'unavailable' });
    expect(read).toHaveBeenCalledTimes(2);
  });

  it('does not retry a non-transient error', async () => {
    const permissionError = Object.assign(new Error('permission-denied'), {
      code: 'permission-denied',
    });
    const read = jest.fn().mockRejectedValue(permissionError);
    await expect(withOfflineRetry(read, 3, 0)).rejects.toBe(permissionError);
    expect(read).toHaveBeenCalledTimes(1);
  });
});
