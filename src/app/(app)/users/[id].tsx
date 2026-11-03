import { useLocalSearchParams } from 'expo-router';

import { useCurrentUser } from '@/features/auth';
import { UserDetailScreen } from '@/features/users';

export default function UserDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useCurrentUser();
  // UI only: the API enforces the same rule on every write.
  return <UserDetailScreen id={id} canManage={user.role === 'admin'} />;
}
