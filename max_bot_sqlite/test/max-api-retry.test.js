import test from 'node:test';
import assert from 'node:assert/strict';
import { isRetriableMaxApiError, retryMaxApiCall } from '../src/max-api-retry.js';

test('isRetriableMaxApiError recognizes transient MAX API failures', () => {
  assert.equal(
    isRetriableMaxApiError({
      message: 'fetch failed',
      cause: { code: 'UND_ERR_HEADERS_TIMEOUT', message: 'Headers Timeout Error' },
    }),
    true
  );
  assert.equal(
    isRetriableMaxApiError({
      message: 'Attachment not ready',
    }),
    true
  );
  assert.equal(
    isRetriableMaxApiError({
      status: 503,
      message: 'Service unavailable',
    }),
    true
  );
  assert.equal(
    isRetriableMaxApiError({
      status: 401,
      message: 'Invalid access_token',
    }),
    false
  );
});

test('retryMaxApiCall retries transient failures and then succeeds', async () => {
  let attempts = 0;
  const delays = [];

  const result = await retryMaxApiCall(
    'reply',
    async () => {
      attempts += 1;
      if (attempts < 3) {
        throw {
          message: 'fetch failed',
          cause: { code: 'UND_ERR_HEADERS_TIMEOUT', message: 'Headers Timeout Error' },
        };
      }
      return 'ok';
    },
    {
      retries: 3,
      delaysMs: [10, 20, 30],
      sleepFn: async (ms) => delays.push(ms),
    }
  );

  assert.equal(result, 'ok');
  assert.equal(attempts, 3);
  assert.deepEqual(delays, [10, 20]);
});

test('retryMaxApiCall does not retry non-retriable errors', async () => {
  let attempts = 0;

  await assert.rejects(
    retryMaxApiCall(
      'reply',
      async () => {
        attempts += 1;
        throw {
          status: 401,
          message: 'Invalid access_token',
        };
      },
      {
        retries: 3,
        delaysMs: [10, 20, 30],
        sleepFn: async () => {},
      }
    ),
    (err) => err.status === 401
  );

  assert.equal(attempts, 1);
});
