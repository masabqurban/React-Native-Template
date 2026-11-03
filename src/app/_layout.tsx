import { QueryClientProvider } from '@tanstack/react-query';
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider as NavigationThemeProvider,
  type ErrorBoundaryProps,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';

import { ErrorState } from '@/components/states';
import { sessionStore, useSession } from '@/features/auth';
import { connectQueryToDevice, queryClient } from '@/lib/api';
import { ThemeProvider, useTheme } from '@/theme';

// Keep the native splash screen up until we know whether the user is signed in,
// so they never see a flash of the sign-in screen.
void SplashScreen.preventAutoHideAsync();

/**
 * Catches render errors in any route, so one broken screen never crashes the
 * app. Expo Router renders it *instead of* this layout, outside its providers,
 * so it must bring its own ThemeProvider.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <ThemeProvider>
      <View style={{ flex: 1 }}>
        <ErrorState error={error} onRetry={() => void retry()} />
      </View>
    </ThemeProvider>
  );
}

function RootNavigator() {
  const session = useSession();
  const { colors, scheme } = useTheme();

  useEffect(() => {
    if (session.status !== 'loading') void SplashScreen.hideAsync();
  }, [session.status]);

  if (session.status === 'loading') return null;
  const signedIn = session.status === 'signed-in';

  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      notification: colors.danger,
    },
  };

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Auth gating: when the session changes, Expo Router swaps the
            available screens and redirects. Client-side only: the API must
            authorise every request itself. */}
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(app)" />
          <Stack.Screen
            name="user-form"
            options={{ presentation: 'modal', headerShown: true, title: 'User' }}
          />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="sign-in" />
        </Stack.Protected>
      </Stack>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  useEffect(() => {
    void sessionStore.restore();
    return connectQueryToDevice();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RootNavigator />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
