import NetInfo from '@react-native-community/netinfo';
import { focusManager, onlineManager, QueryClient } from '@tanstack/react-query';
import { AppState, Platform, type AppStateStatus } from 'react-native';

import { isApiError } from './api-error';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // Retrying a 4xx never helps and only wastes battery and data.
        retry: (failureCount, error) =>
          !(isApiError(error) && error.isClientError) && failureCount < 2,
      },
      mutations: {
        // Writes are never replayed automatically: a retried POST can duplicate data.
        retry: false,
      },
    },
  });
}

export const queryClient = createQueryClient();

/**
 * TanStack Query knows about browser focus and connectivity, not mobile ones.
 * These bridges make it refetch stale data when the app returns to the
 * foreground, and pause or resume requests as the network drops and returns.
 * Returns a cleanup function.
 */
export function connectQueryToDevice() {
  const unsubscribeNet = NetInfo.addEventListener((state) => {
    onlineManager.setOnline(state.isConnected !== false);
  });

  const onAppStateChange = (status: AppStateStatus) => {
    if (Platform.OS !== 'web') focusManager.setFocused(status === 'active');
  };
  const appState = AppState.addEventListener('change', onAppStateChange);

  return () => {
    unsubscribeNet();
    appState.remove();
  };
}
