import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, StyleSheet } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { mocksEnabled } from '@/config/env';
import {
  profileSchema,
  sessionStore,
  updateMe,
  type ProfileValues,
  type SessionUser,
} from '@/features/auth';
import { errorMessage, isApiError } from '@/lib/api';
import { confirm, notify } from '@/lib/dialogs';
import { space, themePreferences, useTheme } from '@/theme';

const themeOptions = themePreferences.map((value) => ({
  value,
  label: value === 'system' ? 'System' : value === 'light' ? 'Light' : 'Dark',
}));

function ProfileCard({ user }: { user: SessionUser }) {
  const { control, handleSubmit, setError, reset, formState } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name, email: user.email },
  });
  const save = useMutation({
    mutationFn: updateMe,
    onSuccess: (updated) => {
      sessionStore.setUser(updated);
      reset({ name: updated.name, email: updated.email });
      notify('Profile updated');
    },
    onError: (error) => {
      if (isApiError(error) && error.code === 'EMAIL_TAKEN') {
        setError('email', { message: error.message });
      } else {
        notify("Couldn't save your profile", errorMessage(error));
      }
    },
  });

  return (
    <Card style={styles.card}>
      <Text variant="title" accessibilityRole="header">
        Profile
      </Text>
      <Controller
        control={control}
        name="name"
        render={({ field, fieldState }) => (
          <TextField
            label="Full name"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            autoComplete="name"
          />
        )}
      />
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <TextField
            label="Email"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
        )}
      />
      <Button
        title="Save profile"
        disabled={!formState.isDirty}
        loading={save.isPending}
        onPress={() => void handleSubmit((values) => save.mutate(values))()}
      />
    </Card>
  );
}

export function SettingsScreen({ user }: { user: SessionUser }) {
  const { colors, preference, setPreference } = useTheme();

  const confirmSignOut = async () => {
    if (await confirm({ title: 'Sign out?', confirmText: 'Sign out', destructive: true })) {
      await sessionStore.signOut();
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
    >
      <ProfileCard user={user} />

      <Card style={styles.card}>
        <Text variant="title" accessibilityRole="header">
          Appearance
        </Text>
        <SegmentedControl
          label="Theme"
          options={themeOptions}
          value={preference}
          onChange={setPreference}
        />
      </Card>

      <Button title="Sign out" variant="danger" onPress={() => void confirmSignOut()} />

      <Text variant="caption" color="muted" style={styles.version}>
        Version {Constants.expoConfig?.version ?? 'unknown'}
        {mocksEnabled ? ' · Demo mode (mock API)' : ''}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.lg },
  card: { gap: space.lg },
  version: { textAlign: 'center' },
});
