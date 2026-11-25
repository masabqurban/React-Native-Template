import { apiBaseUrl, mocksEnabled } from '@/config/env';

import { createMockFetch } from '../../mocks/mock-fetch';
import { isApiError } from './api-error';
import { createHttpClient, type Fetch, type HttpClient } from './http-client';
import { dataEnvelope, tokensSchema } from './schemas';
import { tokenStore } from './token-store';

/** In mock mode, requests are answered in-app instead of going to the network. */
const transport: Fetch | undefined = mocksEnabled ? createMockFetch() : undefined;

// A separate client without onUnauthorized, so a failing refresh can't recurse.
const bareClient = createHttpClient({ baseUrl: apiBaseUrl, fetch: transport });

/**
 * Coordinates single-flight refresh-token rotation, epoch guarding across
 * sign-in/sign-out, and auth failure notification on explicit 401/403 rejection.
 */
export function createSessionRefresher(client: Pick<HttpClient, 'post'>) {
  let refreshInFlight: Promise<boolean> | null = null;
  let sessionEpoch = 0;
  const authFailureListeners = new Set<() => void>();

  function notifyAuthFailure() {
    authFailureListeners.forEach((listener) => {
      listener();
    });
  }

  function resetSessionRefresh() {
    sessionEpoch += 1;
    refreshInFlight = null;
  }

  function onAuthFailure(listener: () => void): () => void {
    authFailureListeners.add(listener);
    return () => {
      authFailureListeners.delete(listener);
    };
  }

  function refreshSession(): Promise<boolean> {
    if (refreshInFlight) return refreshInFlight;

    const epoch = sessionEpoch;
    const promise = (async () => {
      const refreshToken = await tokenStore.getRefresh();
      if (!refreshToken) {
        if (epoch === sessionEpoch) notifyAuthFailure();
        return false;
      }
      try {
        const { data } = await client.post('/auth/refresh', {
          schema: dataEnvelope(tokensSchema),
          body: { refreshToken },
        });
        if (epoch !== sessionEpoch) return false;
        await tokenStore.setTokens(data);
        return true;
      } catch (error) {
        if (epoch !== sessionEpoch) return false;
        // Preserve Keychain/Keystore tokens across offline, timeout and 5xx errors;
        // only explicit 401/403 rejection invalidates the stored session.
        if (isApiError(error) && (error.status === 401 || error.status === 403)) {
          await tokenStore.clear().catch(() => undefined);
          notifyAuthFailure();
        }
        return false;
      }
    })().finally(() => {
      if (refreshInFlight === promise) refreshInFlight = null;
    });

    refreshInFlight = promise;
    return promise;
  }

  return { refreshSession, resetSessionRefresh, onAuthFailure };
}

export const { refreshSession, resetSessionRefresh, onAuthFailure } =
  createSessionRefresher(bareClient);

/** The single client every feature uses to call the API. */
export const api = createHttpClient({
  baseUrl: apiBaseUrl,
  fetch: transport,
  getHeaders: (): Record<string, string> => {
    const token = tokenStore.getAccess();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
  onUnauthorized: refreshSession,
});
