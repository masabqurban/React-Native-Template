import { useQuery } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ErrorState, LoadingState } from '@/components/states';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { errorMessage } from '@/lib/api';
import { confirm, notify } from '@/lib/dialogs';
import { formatDate } from '@/lib/format';
import { space, useTheme } from '@/theme';

import { useDeleteUser, userQueryOptions } from '../api';
import { UserRoleBadge, UserStatusBadge } from './user-badges';

export function UserDetailScreen({ id, canManage }: { id: string; canManage: boolean }) {
  const { colors } = useTheme();
  const router = useRouter();
  const user = useQuery(userQueryOptions(id));
  const deleteUser = useDeleteUser();

  if (user.isPending) return <LoadingState label="Loading user" />;
  if (user.isError) return <ErrorState error={user.error} onRetry={() => void user.refetch()} />;

  const { data } = user;

  const confirmDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete user?',
      message: `${data.name} will lose access immediately. This can't be undone.`,
      confirmText: 'Delete',
      destructive: true,
    });
    if (!confirmed) return;
    deleteUser.mutate(data, {
      onSuccess: () => router.back(),
      onError: (error) => notify("Couldn't delete user", errorMessage(error)),
    });
  };

  const fields = [
    { label: 'Email', value: data.email },
    { label: 'Joined', value: formatDate(data.createdAt) },
    { label: 'Last active', value: data.lastActiveAt ? formatDate(data.lastActiveAt) : 'Never' },
  ];

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Stack.Screen options={{ title: data.name }} />

      <View style={styles.header}>
        <Avatar name={data.name} size={72} />
        <Text variant="title" accessibilityRole="header">
          {data.name}
        </Text>
        <View style={styles.badges}>
          <UserRoleBadge role={data.role} />
          <UserStatusBadge status={data.status} />
        </View>
      </View>

      <Card>
        {fields.map((field) => (
          <View key={field.label} style={styles.field} accessible>
            <Text variant="small" color="muted">
              {field.label}
            </Text>
            <Text>{field.value}</Text>
          </View>
        ))}
      </Card>

      {canManage ? (
        <View style={styles.actions}>
          <Button
            title="Edit user"
            variant="secondary"
            onPress={() => router.push({ pathname: '/user-form', params: { id: data.id } })}
          />
          <Button
            title="Delete user"
            variant="danger"
            loading={deleteUser.isPending}
            onPress={() => void confirmDelete()}
          />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.xl },
  header: { alignItems: 'center', gap: space.sm },
  badges: { flexDirection: 'row', gap: space.sm },
  field: { gap: 2, paddingVertical: space.xs },
  actions: { gap: space.md },
});
