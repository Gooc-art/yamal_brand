const DEFAULT_DELAYS_MS = [400, 1200];

const RETRIABLE_CODES = new Set([
  'ECONNABORTED',
  'ECONNRESET',
  'ECONNREFUSED',
  'EPIPE',
  'ETIMEDOUT',
  'UND_ERR_BODY_TIMEOUT',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT',
]);

const RETRIABLE_MESSAGE_PATTERNS = [
  /attachment not ready/iu,
  /fetch failed/iu,
  /headers timeout/iu,
  /connect timeout/iu,
  /body timeout/iu,
  /socket hang up/iu,
  /network error/iu,
];

function errorText(err) {
  return [err?.message, err?.cause?.message].filter(Boolean).join(' | ');
}

export function isRetriableMaxApiError(err) {
  const status = Number(err?.status || err?.response?.status || 0);
  if (status === 408 || status === 409 || status === 425 || status === 429 || status >= 500) {
    return true;
  }

  const code = String(err?.code || err?.cause?.code || '');
  if (RETRIABLE_CODES.has(code)) {
    return true;
  }

  const text = errorText(err);
  return RETRIABLE_MESSAGE_PATTERNS.some((pattern) => pattern.test(text));
}

function summarizeError(err) {
  return {
    status: Number(err?.status || err?.response?.status || 0) || undefined,
    code: err?.code || err?.cause?.code || undefined,
    message: err?.message || undefined,
    cause: err?.cause?.message || undefined,
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retryMaxApiCall(label, fn, options = {}) {
  const {
    retries = DEFAULT_DELAYS_MS.length,
    delaysMs = DEFAULT_DELAYS_MS,
    sleepFn = sleep,
  } = options;

  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (err) {
      if (!isRetriableMaxApiError(err) || attempt >= retries) {
        throw err;
      }

      const delayMs = delaysMs[Math.min(attempt, delaysMs.length - 1)] ?? 1000;
      console.warn('[max-api] retrying request', {
        label,
        attempt: attempt + 1,
        delayMs,
        ...summarizeError(err),
      });
      attempt += 1;
      await sleepFn(delayMs);
    }
  }
}
