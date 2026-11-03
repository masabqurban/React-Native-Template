import type { z } from 'zod';

import { ApiError } from './api-error';

type QueryValue = string | number | boolean | null | undefined;
type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export type RequestOptions<TSchema extends z.ZodType> = {
  /**
   * Every response is validated, so a backend contract change fails loudly
   * here instead of as a crash deep inside a screen.
   */
  schema: TSchema;
  query?: Record<string, QueryValue>;
  body?: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
};

export type Fetch = (url: string, init: RequestInit) => Promise<Response>;

export type HttpClientConfig = {
  baseUrl: string;
  /** Injected so tests and the mock API can replace the network. */
  fetch?: Fetch;
  /** Resolved per request, e.g. to attach the access token. */
  getHeaders?: () => Record<string, string>;
  /** Called once on 401. Return true to retry with fresh headers. */
  onUnauthorized?: () => Promise<boolean>;
};

const DEFAULT_TIMEOUT_MS = 15_000;

/**
 * Plain string building: React Native's `URL` implementation has historically
 * been incomplete, so it isn't relied on.
 */
export function buildUrl(baseUrl: string, path: string, query?: Record<string, QueryValue>) {
  const params = Object.entries(query ?? {})
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  const url = `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
  return params ? `${url}?${params}` : url;
}

async function readBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

/** Accepts `{ error: { code, message, details } }` and `{ code, message }` bodies. */
function toApiError(response: Response, body: unknown): ApiError {
  const envelope = (
    typeof body === 'object' && body !== null && 'error' in body ? body.error : body
  ) as { message?: unknown; code?: unknown; details?: unknown } | undefined;
  return new ApiError(
    typeof envelope?.message === 'string' ? envelope.message : 'Request failed',
    response.status,
    typeof envelope?.code === 'string' ? envelope.code : `HTTP_${response.status}`,
    envelope?.details,
  );
}

/** Typed fetch wrapper: timeouts, cancellation, error normalisation and response validation. */
export function createHttpClient(config: HttpClientConfig) {
  async function request<TSchema extends z.ZodType>(
    method: HttpMethod,
    path: string,
    options: RequestOptions<TSchema>,
    retried = false,
  ): Promise<z.infer<TSchema>> {
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    // AbortSignal.timeout/any aren't guaranteed on every RN runtime, so wire it by hand.
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
    const onAbort = () => {
      controller.abort();
    };
    options.signal?.addEventListener('abort', onAbort);

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...config.getHeaders?.(),
    };
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';

    let response: Response;
    try {
      response = await (config.fetch ?? fetch)(buildUrl(config.baseUrl, path, options.query), {
        method,
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: controller.signal,
      });
    } catch (error) {
      if (timedOut) throw new ApiError(`Request timed out after ${timeoutMs}ms`, 0, 'TIMEOUT');
      // Caller-initiated aborts (TanStack Query cancelling a stale request) propagate untouched.
      if (options.signal?.aborted) throw error;
      throw new ApiError('Network request failed', 0, 'NETWORK_ERROR', error);
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener('abort', onAbort);
    }

    const data = await readBody(response);

    if (!response.ok) {
      if (response.status === 401 && config.onUnauthorized && !retried) {
        if (await config.onUnauthorized()) return request(method, path, options, true);
      }
      throw toApiError(response, data);
    }

    const result = options.schema.safeParse(data);
    if (!result.success) {
      throw new ApiError(
        `Unexpected response shape from ${method} ${path}`,
        response.status,
        'INVALID_RESPONSE',
        result.error.issues,
      );
    }
    return result.data;
  }

  return {
    get: <T extends z.ZodType>(path: string, options: RequestOptions<T>) =>
      request('GET', path, options),
    post: <T extends z.ZodType>(path: string, options: RequestOptions<T>) =>
      request('POST', path, options),
    patch: <T extends z.ZodType>(path: string, options: RequestOptions<T>) =>
      request('PATCH', path, options),
    delete: <T extends z.ZodType>(path: string, options: RequestOptions<T>) =>
      request('DELETE', path, options),
  };
}

export type HttpClient = ReturnType<typeof createHttpClient>;
