import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View, type TextInputInstance } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { mocksEnabled } from '@/config/env';
import { errorMessage, isApiError } from '@/lib/api';
import { radius, space, useTheme } from '@/theme';

import { signIn } from '../api';
import { signInSchema, type SignInInput, type SignInValues } from '../schemas';
import { sessionStore } from '../session-store';

function signInErrorMessage(error: unknown): string {
  if (isApiError(error) && error.code === 'INVALID_CREDENTIALS')
    return 'Incorrect email or password.';
  if (isApiError(error) && error.code === 'ACCOUNT_INACTIVE') {
    return 'This account is not active. Contact an administrator.';
  }
  return errorMessage(error);
}

export function SignInForm() {
  const { colors } = useTheme();
  const passwordRef = useRef<TextInputInstance>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const { control, handleSubmit, resetField, formState } = useForm<
    SignInInput,
    unknown,
    SignInValues
  >({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      // Updating the session flips the auth guard, which navigates to the app.
      sessionStore.setUser(await signIn(values));
    } catch (error) {
      setFormError(signInErrorMessage(error));
      resetField('password');
    }
  });

  return (
    <View style={styles.form}>
      {formError ? (
        <View
          // One accessible element, so the whole message is announced as an alert.
          accessible
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
          style={[styles.alert, { backgroundColor: colors.dangerSoft }]}
        >
          <Text variant="small" color="danger">
            {formError}
          </Text>
        </View>
      ) : null}

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
            autoComplete="email"
            keyboardType="email-address"
            textContentType="username"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            submitBehavior="submit"
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field, fieldState }) => (
          <TextField
            ref={passwordRef}
            label="Password"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            secureTextEntry
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={() => void submit()}
          />
        )}
      />

      <Button
        title={formState.isSubmitting ? 'Signing in…' : 'Sign in'}
        loading={formState.isSubmitting}
        onPress={() => void submit()}
      />

      {mocksEnabled ? (
        <Text variant="caption" color="muted" style={styles.hint}>
          Demo account: demo@example.com / password123
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: space.lg },
  alert: { padding: space.md, borderRadius: radius.md },
  hint: { textAlign: 'center' },
});
