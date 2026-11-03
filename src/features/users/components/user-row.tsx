import Ionicons from '@expo/vector-icons/Ionicons';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Text } from '@/components/ui/text';
import { space, useTheme } from '@/theme';

import type { User } from '../schemas';
import { UserStatusBadge } from './user-badges';

type UserRowProps = { user: User; onPress: (user: User) => void };

/** One list row. Memoised because long lists re-render rows often while scrolling. */
export const UserRow = memo(function UserRow({ user, onPress }: UserRowProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${user.name}, ${user.email}, ${user.role}, ${user.status}`}
      accessibilityHint="Opens the user's details"
      onPress={() => onPress(user)}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? colors.background : colors.card },
      ]}
    >
      <Avatar name={user.name} />
      <View style={styles.text}>
        <Text weight="600" numberOfLines={1}>
          {user.name}
        </Text>
        <Text variant="small" color="muted" numberOfLines={1}>
          {user.email}
        </Text>
      </View>
      <UserStatusBadge status={user.status} />
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    minHeight: 64,
  },
  text: { flex: 1, gap: 2 },
});
