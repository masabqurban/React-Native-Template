import { Badge, type BadgeTone } from '@/components/ui/badge';

import type { UserRole, UserStatus } from '../schemas';

const statusTone = {
  active: 'success',
  invited: 'warning',
  suspended: 'danger',
} as const satisfies Record<UserStatus, BadgeTone>;

export function UserStatusBadge({ status }: { status: UserStatus }) {
  return <Badge label={status} tone={statusTone[status]} />;
}

export function UserRoleBadge({ role }: { role: UserRole }) {
  return <Badge label={role} tone={role === 'admin' ? 'primary' : 'neutral'} />;
}
