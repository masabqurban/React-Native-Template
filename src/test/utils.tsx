import { QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { createQueryClient, tokenStore } from '@/lib/api';
import { ThemeProvider } from '@/theme';

/** Renders with a fresh QueryClient per test, so cached data never leaks between tests. */
export async function renderWithProviders(ui: ReactElement) {
  const queryClient = createQueryClient();
  queryClient.setDefaultOptions({ queries: { retry: false } });
  return {
    queryClient,
    ...(await render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>{ui}</ThemeProvider>
      </QueryClientProvider>,
    )),
  };
}

/** Signs in as the seeded demo admin by issuing a token the mock API accepts. */
export async function signInAsDemo() {
  await tokenStore.setTokens({
    accessToken: `mock-access.usr_0001.${Date.now() + 60_000}`,
    refreshToken: 'mock-refresh.usr_0001.test',
  });
}
