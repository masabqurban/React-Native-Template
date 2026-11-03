import { createMockFetch } from './mock-fetch';

const fetch = createMockFetch({ latencyMs: 0 });
const BASE = 'https://mock.api.local/api/v1';

async function call(path: string, init: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, init);
  return { status: res.status, body: res.status === 204 ? null : ((await res.json()) as any) };
}

async function login() {
  const { body } = await call('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'demo@example.com', password: 'password123' }),
  });
  return { Authorization: `Bearer ${body.data.accessToken as string}` };
}

/** The mock must honour the same contract as the Node.js-Template API. */
describe('mock API contract', () => {
  it('signs in and rejects bad credentials with the API error codes', async () => {
    const bad = await call('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'demo@example.com', password: 'nope' }),
    });
    expect(bad).toMatchObject({
      status: 401,
      body: { success: false, error: { code: 'INVALID_CREDENTIALS' } },
    });
    expect(await login()).toHaveProperty('Authorization');
  });

  it('requires a token and paginates users', async () => {
    expect((await call('/users')).status).toBe(401);

    const { body } = await call('/users?page=2&pageSize=20&status=active', {
      headers: await login(),
    });
    expect(body.meta).toMatchObject({ page: 2, pageSize: 20 });
    expect(body.data.every((u: { status: string }) => u.status === 'active')).toBe(true);
  });

  it('reports email conflicts on the field', async () => {
    const { status, body } = await call('/users', {
      method: 'POST',
      headers: await login(),
      body: JSON.stringify({ name: 'Copy', email: 'demo@example.com' }),
    });
    expect(status).toBe(409);
    expect(body.error).toMatchObject({ code: 'EMAIL_TAKEN', details: { field: 'email' } });
  });

  it('answers unknown routes with a 404 envelope', async () => {
    expect(await call('/nope')).toMatchObject({
      status: 404,
      body: { error: { code: 'ROUTE_NOT_FOUND' } },
    });
  });
});
