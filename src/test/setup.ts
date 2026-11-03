import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

import { tokenStore } from '@/lib/api';
import { resetDb } from '@/mocks/db';

/* Native modules have no implementation under Jest: replace them with fakes. */

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
jest.mock('@react-native-community/netinfo', () =>
  // jest.mock factories are hoisted above imports, so they must use require().
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-community/netinfo/jest/netinfo-mock.js'),
);

// Icon fonts can't load under Jest; render icons as nothing.
jest.mock('@expo/vector-icons/Ionicons', () => {
  const Icon = () => null;
  return { __esModule: true, default: Icon };
});

// An in-memory keychain, so token persistence can be asserted.
const mockSecureStore = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
  getItemAsync: jest.fn((key: string) => Promise.resolve(mockSecureStore.get(key) ?? null)),
  setItemAsync: jest.fn((key: string, value: string) => {
    mockSecureStore.set(key, value);
    return Promise.resolve();
  }),
  deleteItemAsync: jest.fn((key: string) => {
    mockSecureStore.delete(key);
    return Promise.resolve();
  }),
}));

afterEach(async () => {
  resetDb();
  // Clears the in-memory access token as well as the keychain.
  await tokenStore.clear();
  mockSecureStore.clear();
});
