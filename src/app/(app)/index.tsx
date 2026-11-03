import { DashboardScreen } from '@/features/dashboard';
import { useCurrentUser } from '@/features/auth';

export default function DashboardRoute() {
  const user = useCurrentUser();
  return <DashboardScreen firstName={user.name.split(' ')[0] ?? user.name} />;
}
