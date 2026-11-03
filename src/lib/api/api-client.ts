import { apiBaseUrl, mocksEnabled } from '@/config/env';

import { createMockFetch } from '../../mocks/mock-fetch';
import { createHttpClient, type Fetch } from './http-client';
import { dataEnvelope, tokensSchema } from './schemas';
import { tokenStore } from './token-store';

/** In mock mode, requests are answered in-app instead of going to the network. */
const transport: Fetch | undefined = mocksEnabled ? createMockFetch() : undefined;

// A separate client without onUnauthorized, so a failing refresh can't recurse.
const bareClient = createHttpClient({ baseUrl: apiBaseUrl, fetch: transport });

let refreshInFlight: Promise<boolean> | null = null;

/**
 * Exchanges the stored refresh token for new tokens. Single-flight: when
 * several requests hit a 401 at once they share one refresh, instead of racing
 * and tripping the server's refresh-token reuse detection.
 */
export function refreshSession(): Promise<boolean> {
  refreshInFlight ??= (async () => {
    const refreshToken = await tokenStore.getRefresh();
    if (!refreshToken) return false;
    try {
      const { data } = await bareClient.post('/auth/refresh', {
        schema: dataEnvelope(tokensSchema),
        body: { refreshToken },
      });
      await tokenStore.setTokens(data);
      return true;
    } catch {
      await tokenStore.clear();
      return false;
    }
  })().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

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
