import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useRouter } from 'expo-router';
import { Pressable } from 'react-native';

import { useCurrentUser } from '@/features/auth';
import { MIN_TOUCH_TARGET, useTheme } from '@/theme';

export default function UsersStackLayout() {
  const { colors } = useTheme();
  const router = useRouter();
  const user = useCurrentUser();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Users',
          headerRight:
            user.role === 'admin'
              ? () => (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Add user"
                    hitSlop={8}
                    style={{
                      minWidth: MIN_TOUCH_TARGET,
                      minHeight: MIN_TOUCH_TARGET,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onPress={() => router.push('/user-form')}
                  >
                    <Ionicons name="add" size={28} color={colors.primary} />
                  </Pressable>
                )
              : undefined,
        }}
      />
      <Stack.Screen name="[id]" options={{ title: '' }} />
    </Stack>
  );
}
