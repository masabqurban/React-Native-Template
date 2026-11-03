import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/states';
import { Text } from '@/components/ui/text';
import { space, useTheme } from '@/theme';

/** Shown for unknown deep links, e.g. `acme://does-not-exist`. */
export default function NotFoundScreen() {
  const { colors } = useTheme();
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Not found', headerShown: true }} />
      <EmptyState
        icon="help-circle-outline"
        title="Page not found"
        message="This link doesn't lead anywhere."
      />
      <Link href="/" style={styles.link}>
        <Text color="link" weight="600">
          Go to the home screen
        </Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingBottom: space.xxl, alignItems: 'center' },
  link: { padding: space.md },
});
