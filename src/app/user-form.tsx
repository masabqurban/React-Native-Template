import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import { ErrorState, LoadingState } from '@/components/states';
import { useCurrentUser } from '@/features/auth';
import { UserForm, userQueryOptions, type User } from '@/features/users';
import { space, useTheme } from '@/theme';

/** Modal for creating (`/user-form`) or editing (`/user-form?id=…`) a user. */
export default function UserFormModal() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const currentUser = useCurrentUser();
  const existing = useQuery({ ...userQueryOptions(id ?? ''), enabled: Boolean(id) });

  if (currentUser.role !== 'admin') {
    return <ErrorState error={new Error('Only admins can manage users.')} />;
  }
  if (id && existing.isPending) return <LoadingState />;
  if (id && existing.isError) {
    return <ErrorState error={existing.error} onRetry={() => void existing.refetch()} />;
  }

  const onSaved = (_user: User) => {
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ title: id ? 'Edit user' : 'Add user' }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <UserForm user={existing.data} onSaved={onSaved} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg },
});
