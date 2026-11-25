import { waitFor } from '@testing-library/react-native';

import { createSessionRefresher } from './api-client';
import { createHttpClient, type Fetch } from './http-client';
import { tokenStore } from './token-store';

function makeRefresher(fetch: Fetch) {
  return createSessionRefresher(createHttpClient({ baseUrl: 'https://api.test/api/v1', fetch }));
}

describe('refreshSession', () => {
  it('preserves stored refresh token on offline network errors and 5xx responses', async () => {
    await tokenStore.setTokens({
      accessToken: 'expired-access',
      refreshToken: 'keep-me-offline',
    });

    const networkFail = makeRefresher(() =>
      Promise.reject(new TypeError('Network request failed')),
    );
    const onFail = jest.fn();
    const unsub = networkFail.onAuthFailure(onFail);

    try {
      await expect(networkFail.refreshSession()).resolves.toBe(false);
      await expect(tokenStore.getRefresh()).resolves.toBe('keep-me-offline');
      expect(onFail).not.toHaveBeenCalled();

      const serverFail = makeRefresher(() =>
        Promise.resolve(
          new Response(JSON.stringify({ error: { code: 'INTERNAL', message: 'Down' } }), {
            status: 503,
          }),
        ),
      );
      await expect(serverFail.refreshSession()).resolves.toBe(false);
      await expect(tokenStore.getRefresh()).resolves.toBe('keep-me-offline');
    } finally {
      unsub();
    }
  });

  it('clears tokens and notifies auth failure when refresh token is rejected with 401', async () => {
    await tokenStore.setTokens({
      accessToken: 'expired-access',
      refreshToken: 'revoked-token',
    });

    const authFail = makeRefresher(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({ success: false, error: { code: 'TOKEN_INVALID', message: 'Invalid' } }),
          { status: 401 },
        ),
      ),
    );
    const onFail = jest.fn();
    const unsub = authFail.onAuthFailure(onFail);

    try {
      await expect(authFail.refreshSession()).resolves.toBe(false);
      await expect(tokenStore.getRefresh()).resolves.toBeNull();
      expect(onFail).toHaveBeenCalledTimes(1);
    } finally {
      unsub();
    }
  });

  it('ignores in-flight refresh results if session was reset (sign-out race)', async () => {
    await tokenStore.setTokens({
      accessToken: 'expired-access',
      refreshToken: 'race-token',
    });

    let resolveFetch: ((res: Response) => void) | undefined;
    const mockFetch = jest.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );
    const refresher = makeRefresher(mockFetch);

    const refreshPromise = refresher.refreshSession();
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    refresher.resetSessionRefresh();
    await tokenStore.clear();

    resolveFetch?.(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            accessToken: 'new-access',
            refreshToken: 'new-refresh',
            accessTokenExpiresAt: new Date(Date.now() + 60_000).toISOString(),
          },
        }),
        { status: 200 },
      ),
    );

    await expect(refreshPromise).resolves.toBe(false);
    await expect(tokenStore.getRefresh()).resolves.toBeNull();
  });
});
