export type Fetcher<T> = (signal?: AbortSignal) => Promise<T>;

const MAX_RETRIES = 3;
const BASE_DELAY = 500; // ms
const REQUEST_TIMEOUT = 8000;

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function withTimeout<T>(
  fn: Fetcher<T>,
  timeout: number,
  signal?: AbortSignal
): Promise<T> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    return await fn(signal ?? controller.signal);
  } finally {
    clearTimeout(id);
  }
}

export async function fetchWithRetry<T>(
  fn: Fetcher<T>,
  signal?: AbortSignal
): Promise<T> {
  let attempt = 0;

  while (true) {
    try {
      return await withTimeout(fn, REQUEST_TIMEOUT, signal);
    } catch (err: unknown) {
      if (signal?.aborted) throw err;

      attempt++;
      if (attempt > MAX_RETRIES) {
        console.error("❌ Max retries reached");
        throw err;
      }

      const delay = BASE_DELAY * Math.pow(2, attempt - 1); // 0.5s, 1s, 2s
      console.warn(`🔁 Retry ${attempt} in ${delay}ms`);
      await sleep(delay);
    }
  }
}