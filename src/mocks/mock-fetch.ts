import { db, DEMO_CREDENTIALS, type MockUser } from './db';

/*
 * A `fetch` replacement that answers like the companion Node.js-Template API:
 *   POST /auth/login · /auth/refresh · /auth/logout
 *   GET/PATCH /me · GET /dashboard/summary
 *   GET/POST /users · GET/PATCH/DELETE /users/:id
 * Same envelopes, status codes and error codes, so switching to the real API
 * is only a matter of setting EXPO_PUBLIC_API_URL.
 */

type Handler = (ctx: {
  body: Record<string, unknown>;
  query: Record<string, string>;
  params: Record<string, string>;
  actor: MockUser | undefined;
}) => Response | Promise<Response>;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const ok = (data: unknown, status = 200, meta?: unknown) =>
  json({ success: true, data, ...(meta ? { meta } : {}) }, status);
const fail = (status: number, code: string, message: string, details?: unknown) =>
  json({ success: false, error: { code, message, details } }, status);
const noContent = () => new Response(null, { status: 204 });
const unauthorized = () => fail(401, 'TOKEN_INVALID', 'Your session has expired.');

// MOCK TOKENS ONLY: a real API issues signed JWTs and stores hashed refresh tokens.
const ACCESS_TTL_MS = 15 * 60_000;
const issueTokens = (userId: string) => ({
  accessToken: `mock-access.${userId}.${Date.now() + ACCESS_TTL_MS}`,
  refreshToken: `mock-refresh.${userId}.${Math.random().toString(36).slice(2)}`,
  accessTokenExpiresAt: new Date(Date.now() + ACCESS_TTL_MS).toISOString(),
});

function actorFrom(headers: Headers): MockUser | undefined {
  const [kind, userId, expiresAt] =
    headers
      .get('Authorization')
      ?.replace(/^Bearer /, '')
      .split('.') ?? [];
  if (kind !== 'mock-access' || Number(expiresAt) < Date.now()) return undefined;
  return db.users.find((u) => u.id === userId && u.status === 'active');
}

const emailTaken = (email: string, exceptId?: string) =>
  db.users.some((u) => u.email === email.toLowerCase() && u.id !== exceptId);
const conflict = () =>
  fail(409, 'EMAIL_TAKEN', 'Another account already uses this email.', { field: 'email' });

const authed =
  (handler: Handler): Handler =>
  (ctx) =>
    ctx.actor ? handler(ctx) : unauthorized();

const routes: [method: string, pattern: string, handler: Handler][] = [
  [
    'POST',
    '/auth/login',
    ({ body }) => {
      const email = String(body.email ?? '').toLowerCase();
      const user = db.users.find((u) => u.email === email);
      if (!user || body.password !== DEMO_CREDENTIALS.password) {
        return fail(401, 'INVALID_CREDENTIALS', 'Incorrect email or password.');
      }
      if (user.status !== 'active') {
        return fail(403, 'ACCOUNT_INACTIVE', 'This account is not active.');
      }
      user.lastActiveAt = new Date().toISOString();
      return ok({ ...issueTokens(user.id), user });
    },
  ],
  [
    'POST',
    '/auth/refresh',
    ({ body }) => {
      const [kind, userId] = String(body.refreshToken ?? '').split('.');
      const user = db.users.find((u) => u.id === userId && u.status === 'active');
      if (kind !== 'mock-refresh' || !user) return unauthorized();
      const { accessToken, refreshToken, accessTokenExpiresAt } = issueTokens(user.id);
      return ok({ accessToken, refreshToken, accessTokenExpiresAt });
    },
  ],
  ['POST', '/auth/logout', () => noContent()],
  ['GET', '/me', authed(({ actor }) => ok(actor))],
  [
    'PATCH',
    '/me',
    authed(({ actor, body }) => {
      if (typeof body.email === 'string' && emailTaken(body.email, actor?.id)) return conflict();
      Object.assign(actor as MockUser, body);
      return ok(actor);
    }),
  ],
  [
    'GET',
    '/dashboard/summary',
    authed(() => {
      const count = (status: MockUser['status']) =>
        db.users.filter((u) => u.status === status).length;
      return ok({
        stats: [
          {
            key: 'users',
            label: 'Total users',
            value: db.users.length,
            change: 0.124,
            unit: 'count',
          },
          { key: 'new', label: 'New this month', value: 8, change: 0.06, unit: 'count' },
          {
            key: 'active',
            label: 'Active users',
            value: count('active'),
            change: 0.052,
            unit: 'count',
          },
          {
            key: 'pending',
            label: 'Pending invites',
            value: count('invited'),
            change: -0.1,
            unit: 'count',
          },
        ],
        suspended: count('suspended'),
        signups: [
          { month: 'Jun', count: 42 },
          { month: 'Jul', count: 58 },
          { month: 'Aug', count: 51 },
          { month: 'Sep', count: 73 },
          { month: 'Oct', count: 88 },
          { month: 'Nov', count: 96 },
        ],
      });
    }),
  ],
  [
    'GET',
    '/users',
    authed(({ query }) => {
      const q = query.q?.trim().toLowerCase();
      const { role, status } = query;
      const page = Math.max(Number(query.page ?? 1), 1);
      const pageSize = Math.min(Number(query.pageSize ?? 10), 100);
      const filtered = db.users
        .filter((u) => !q || u.name.toLowerCase().includes(q) || u.email.includes(q))
        .filter((u) => !role || u.role === role)
        .filter((u) => !status || u.status === status)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return ok(filtered.slice((page - 1) * pageSize, page * pageSize), 200, {
        page,
        pageSize,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / pageSize),
      });
    }),
  ],
  [
    'GET',
    '/users/:id',
    authed(({ params }) => {
      const user = db.users.find((u) => u.id === params.id);
      return user ? ok(user) : fail(404, 'NOT_FOUND', 'User not found.');
    }),
  ],
  [
    'POST',
    '/users',
    authed(({ body, actor }) => {
      if (actor?.role !== 'admin') return fail(403, 'FORBIDDEN', 'You do not have permission.');
      const email = String(body.email).toLowerCase();
      if (emailTaken(email)) return conflict();
      const user: MockUser = {
        id: `usr_${Date.now()}`,
        name: String(body.name),
        email,
        role: (body.role as MockUser['role'] | undefined) ?? 'viewer',
        status: (body.status as MockUser['status'] | undefined) ?? 'invited',
        createdAt: new Date().toISOString(),
        lastActiveAt: null,
      };
      db.users.unshift(user);
      return ok(user, 201);
    }),
  ],
  [
    'PATCH',
    '/users/:id',
    authed(({ params, body, actor }) => {
      if (actor?.role !== 'admin') return fail(403, 'FORBIDDEN', 'You do not have permission.');
      const user = db.users.find((u) => u.id === params.id);
      if (!user) return fail(404, 'NOT_FOUND', 'User not found.');
      if (typeof body.email === 'string' && emailTaken(body.email, user.id)) return conflict();
      Object.assign(user, body);
      return ok(user);
    }),
  ],
  [
    'DELETE',
    '/users/:id',
    authed(({ params, actor }) => {
      if (actor?.role !== 'admin') return fail(403, 'FORBIDDEN', 'You do not have permission.');
      if (actor.id === params.id) {
        return fail(422, 'CANNOT_DELETE_SELF', "You can't delete your own account.");
      }
      const before = db.users.length;
      db.users = db.users.filter((u) => u.id !== params.id);
      return db.users.length < before ? noContent() : fail(404, 'NOT_FOUND', 'User not found.');
    }),
  ],
];

/** Plain parsing: URLSearchParams has historically been incomplete on React Native. */
function parseQuery(search: string): Record<string, string> {
  const query: Record<string, string> = {};
  for (const pair of search.split('&')) {
    if (!pair) continue;
    const [key = '', value = ''] = pair.split('=');
    query[decodeURIComponent(key)] = decodeURIComponent(value.replace(/\+/g, ' '));
  }
  return query;
}

function match(pattern: string, path: string): Record<string, string> | null {
  const a = pattern.split('/');
  const b = path.split('/');
  if (a.length !== b.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < a.length; i++) {
    const segment = a[i] ?? '';
    const value = b[i] ?? '';
    if (segment.startsWith(':')) params[segment.slice(1)] = decodeURIComponent(value);
    else if (segment !== value) return null;
  }
  return params;
}

/** Simulated latency makes loading states visible in development; tests skip it. */
const DEFAULT_LATENCY_MS = process.env.NODE_ENV === 'test' ? 0 : 250;

export function createMockFetch({ latencyMs = DEFAULT_LATENCY_MS }: { latencyMs?: number } = {}) {
  return async (url: string, init: RequestInit = {}): Promise<Response> => {
    if (latencyMs > 0) await new Promise((resolve) => setTimeout(resolve, latencyMs));
    // DOMException isn't guaranteed outside browsers, so build the AbortError by hand.
    if (init.signal?.aborted) throw Object.assign(new Error('Aborted'), { name: 'AbortError' });

    const [fullPath = '', search = ''] = url.split('?');
    const path = fullPath.replace(/^.*\/api\/v1/, '') || '/';
    const method = (init.method ?? 'GET').toUpperCase();
    const headers = new Headers(init.headers);
    const body =
      typeof init.body === 'string' ? (JSON.parse(init.body) as Record<string, unknown>) : {};

    for (const [routeMethod, pattern, handler] of routes) {
      const params = routeMethod === method ? match(pattern, path) : null;
      if (params) {
        return handler({ body, query: parseQuery(search), params, actor: actorFrom(headers) });
      }
    }
    return fail(404, 'ROUTE_NOT_FOUND', `Route ${method} ${path} not found`);
  };
}
