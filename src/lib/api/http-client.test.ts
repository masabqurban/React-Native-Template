import { z } from 'zod';

import { isApiError } from './api-error';
import { buildUrl, createHttpClient, type Fetch } from './http-client';

const BASE = 'https://api.test/api/v1';
const itemSchema = z.object({ id: z.number() });

const respond = (body: unknown, status = 200): Fetch =>
  jest.fn(() =>
    Promise.resolve(new Response(body === undefined ? null : JSON.stringify(body), { status })),
  );

describe('buildUrl', () => {
  it('joins paths, encodes values and skips empty ones', () => {
    expect(
      buildUrl(`${BASE}/`, '/users', { q: 'a b&c', page: 2, role: undefined, status: '' }),
    ).toBe('https://api.test/api/v1/users?q=a%20b%26c&page=2');
  });
});

describe('createHttpClient', () => {
  it('returns validated data and sends JSON', async () => {
    const fetch = respond({ id: 1 });
    const client = createHttpClient({ baseUrl: BASE, fetch });

    await expect(client.post('/items', { schema: itemSchema, body: { a: 1 } })).resolves.toEqual({
      id: 1,
    });
    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/items`,
      expect.objectContaining({
        method: 'POST',
        body: '{"a":1}',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    );
  });

  it('rejects responses that break the contract', async () => {
    const client = createHttpClient({ baseUrl: BASE, fetch: respond({ id: 'nope' }) });
    const error: unknown = await client.get('/x', { schema: itemSchema }).catch((e: unknown) => e);
    expect(isApiError(error) && error.code).toBe('INVALID_RESPONSE');
  });

  it('normalises error envelopes', async () => {
    const client = createHttpClient({
      baseUrl: BASE,
      fetch: respond(
        {
          success: false,
          error: { code: 'EMAIL_TAKEN', message: 'Taken', details: { field: 'email' } },
        },
        409,
      ),
    });
    await expect(client.get('/x', { schema: itemSchema })).rejects.toMatchObject({
      status: 409,
      code: 'EMAIL_TAKEN',
      message: 'Taken',
      details: { field: 'email' },
    });
  });

  it('maps network failures and timeouts', async () => {
    const offline = createHttpClient({
      baseUrl: BASE,
      fetch: () => Promise.reject(new TypeError('Network request failed')),
    });
    await expect(offline.get('/x', { schema: itemSchema })).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    });

    const slow = createHttpClient({
      baseUrl: BASE,
      fetch: (_url, init) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    });
    await expect(slow.get('/x', { schema: itemSchema, timeoutMs: 10 })).rejects.toMatchObject({
      code: 'TIMEOUT',
    });
  });

  it('refreshes once on 401 and retries with the new token', async () => {
    let token = 'old';
    const fetch = jest.fn((_url: string, init: RequestInit) => {
      const auth = (init.headers as Record<string, string>).Authorization;
      return Promise.resolve(
        auth === 'Bearer new'
          ? new Response(JSON.stringify({ id: 7 }), { status: 200 })
          : new Response(null, { status: 401 }),
      );
    });
    const onUnauthorized = jest.fn(() => {
      token = 'new';
      return Promise.resolve(true);
    });
    const client = createHttpClient({
      baseUrl: BASE,
      fetch,
      getHeaders: () => ({ Authorization: `Bearer ${token}` }),
      onUnauthorized,
    });

    await expect(client.get('/x', { schema: itemSchema })).resolves.toEqual({ id: 7 });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
