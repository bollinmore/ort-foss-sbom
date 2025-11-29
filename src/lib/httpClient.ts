import { setTimeout as delay } from 'timers/promises';

export interface HttpRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  retries?: number;
  backoffMs?: number;
  maxBackoffMs?: number;
}

export interface HttpResponse<T = unknown> {
  status: number;
  headers: Headers;
  data: T;
}

function toJsonBody(body: unknown): { body?: string; headers?: Record<string, string> } {
  if (body === undefined || body === null) return {};
  return { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } };
}

export async function requestJson<T = unknown>(
  url: string,
  options: HttpRequestOptions = {}
): Promise<HttpResponse<T>> {
  const {
    method = 'GET',
    headers = {},
    body,
    timeoutMs = 30000,
    retries = 3,
    backoffMs = 500,
    maxBackoffMs = 60000
  } = options;

  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const requestInit: RequestInit = {
        method,
        headers: {
          ...headers,
          ...toJsonBody(body).headers
        },
        body: toJsonBody(body).body,
        signal: controller.signal
      };
      const res = await fetch(url, requestInit);
      const data = (await res.json()) as T;
      clearTimeout(timeout);
      return { status: res.status, headers: res.headers, data };
    } catch (err) {
      lastError = err;
      clearTimeout(timeout);
      if (attempt === retries) break;
      const delayMs = Math.min(backoffMs * 2 ** attempt, maxBackoffMs);
      await delay(delayMs);
      attempt += 1;
    }
  }

  throw lastError ?? new Error('HTTP request failed after retries');
}
