import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { errorMessage } from '@/lib/api';
import { space, useTheme } from '@/theme';

import { Button } from './ui/button';
import { Text } from './ui/text';

type IconName = ComponentProps<typeof Ionicons>['name'];

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.center} accessibilityRole="progressbar" accessibilityLabel={label}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  message,
}: {
  icon: IconName;
  title: string;
  message?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.center}>
      <Ionicons name={icon} size={36} color={colors.muted} accessibilityElementsHidden />
      <Text variant="title">{title}</Text>
      {message ? (
        <Text color="muted" style={styles.message}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}

/** Shows a readable message for any error, and a retry action when one is possible. */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.center} accessibilityRole="alert">
      <Ionicons
        name="cloud-offline-outline"
        size={36}
        color={colors.warning}
        accessibilityElementsHidden
      />
      <Text variant="title">Something went wrong</Text>
      <Text color="muted" style={styles.message}>
        {errorMessage(error)}
      </Text>
      {onRetry ? <Button title="Try again" variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
    padding: space.xl,
  },
  message: { textAlign: 'center', maxWidth: 320 },
});
