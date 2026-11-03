import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { Tokens } from './schemas';

/**
 * The access token lives in memory only. The refresh token goes to the
 * platform keystore (iOS Keychain / Android Keystore) through
 * expo-secure-store: encrypted at rest, unreadable by other apps, and it keeps
 * the user signed in across app restarts. Never put tokens in AsyncStorage,
 * which is plain text on disk.
 */
const REFRESH_KEY = 'auth.refreshToken';

/**
 * expo-secure-store has no web implementation. On web the refresh token is
 * tab-scoped (sessionStorage), matching the React.js-Template.
 */
const storage =
  Platform.OS === 'web'
    ? {
        get: (key: string) => Promise.resolve(globalThis.sessionStorage.getItem(key)),
        set: (key: string, value: string) => {
          globalThis.sessionStorage.setItem(key, value);
          return Promise.resolve();
        },
        remove: (key: string) => {
          globalThis.sessionStorage.removeItem(key);
          return Promise.resolve();
        },
      }
    : {
        get: (key: string) => SecureStore.getItemAsync(key),
        set: (key: string, value: string) =>
          SecureStore.setItemAsync(key, value, {
            // Readable only while the device is unlocked, and never restored to another device.
            keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
          }),
        remove: (key: string) => SecureStore.deleteItemAsync(key),
      };

let accessToken: string | null = null;

export const tokenStore = {
  getAccess: () => accessToken,

  getRefresh: () => storage.get(REFRESH_KEY),

  async setTokens(tokens: Tokens) {
    accessToken = tokens.accessToken;
    await storage.set(REFRESH_KEY, tokens.refreshToken);
  },

  async clear() {
    accessToken = null;
    await storage.remove(REFRESH_KEY);
  },
};
