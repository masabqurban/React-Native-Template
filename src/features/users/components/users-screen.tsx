import { FlashList } from '@shopify/flash-list';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { TextField } from '@/components/ui/text-field';
import { space, useTheme } from '@/theme';

import { usersInfiniteQueryOptions } from '../api';
import type { User, UsersFilter, UserStatus } from '../schemas';
import { UserRow } from './user-row';

type StatusFilter = UserStatus | 'all';

const statusOptions = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'invited', label: 'Invited' },
  { value: 'suspended', label: 'Suspended' },
] as const satisfies readonly { value: StatusFilter; label: string }[];

export function UsersScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);

  const filter: UsersFilter = {
    ...(query ? { q: query } : {}),
    ...(status === 'all' ? {} : { status }),
  };
  const users = useInfiniteQuery(usersInfiniteQueryOptions(filter));
  const items = users.data?.pages.flatMap((page) => page.data) ?? [];

  // Debounced search: one request per pause in typing, not per keystroke.
  const onSearch = (text: string) => {
    setSearch(text);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => setQuery(text.trim()), 300);
  };

  const openUser = (user: User) => {
    router.push({ pathname: '/users/[id]', params: { id: user.id } });
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.filters, { borderColor: colors.border }]}>
        <TextField
          label="Search users"
          placeholder="Name or email"
          value={search}
          onChangeText={onSearch}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        <SegmentedControl
          label="Status"
          options={statusOptions}
          value={status}
          onChange={setStatus}
        />
      </View>

      {users.isPending ? (
        <LoadingState label="Loading users" />
      ) : users.isError && !items.length ? (
        <ErrorState error={users.error} onRetry={() => void users.refetch()} />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(user) => user.id}
          renderItem={({ item }) => <UserRow user={item} onPress={openUser} />}
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
          )}
          onEndReached={() => {
            if (users.hasNextPage && !users.isFetchingNextPage) void users.fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            users.isFetchingNextPage ? <LoadingState label="Loading more" /> : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title="No users found"
              message={query || status !== 'all' ? 'Try a different search or filter.' : undefined}
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={users.isRefetching && !users.isFetchingNextPage}
              onRefresh={() => void users.refetch()}
              tintColor={colors.primary}
            />
          }
          keyboardDismissMode="on-drag"
          contentInsetAdjustmentBehavior="automatic"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  filters: {
    gap: space.md,
    padding: space.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 72 },
});
