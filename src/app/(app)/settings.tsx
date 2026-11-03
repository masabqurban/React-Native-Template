import { useCurrentUser } from '@/features/auth';
import { SettingsScreen } from '@/features/settings';

export default function SettingsRoute() {
  return <SettingsScreen user={useCurrentUser()} />;
}
