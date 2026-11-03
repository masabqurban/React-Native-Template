import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { errorMessage, isApiError } from '@/lib/api';
import { capitalize } from '@/lib/format';
import { space } from '@/theme';

import { useSaveUser } from '../api';
import {
  userFormSchema,
  userRoles,
  userStatuses,
  type User,
  type UserFormInput,
  type UserFormValues,
} from '../schemas';

const roleOptions = userRoles.map((value) => ({ value, label: capitalize(value) }));
const statusOptions = userStatuses.map((value) => ({ value, label: capitalize(value) }));

type UserFormProps = {
  /** Edit this user, or create a new one when omitted. */
  user?: User;
  onSaved: (user: User) => void;
};

/** Create or edit a user. Validation runs on the device; conflicts come back from the API. */
export function UserForm({ user, onSaved }: UserFormProps) {
  const save = useSaveUser();
  const { control, handleSubmit, setError, formState } = useForm<
    UserFormInput,
    unknown,
    UserFormValues
  >({
    resolver: zodResolver(userFormSchema),
    defaultValues: user
      ? { name: user.name, email: user.email, role: user.role, status: user.status }
      : { name: '', email: '', role: 'viewer', status: 'invited' },
  });

  const submit = handleSubmit(async (values) => {
    try {
      onSaved(await save.mutateAsync({ id: user?.id, values }));
    } catch (error) {
      // Show server-side conflicts on the field they belong to.
      if (isApiError(error) && error.code === 'EMAIL_TAKEN') {
        setError('email', { message: error.message }, { shouldFocus: true });
      } else {
        setError('root', { message: errorMessage(error) });
      }
    }
  });

  return (
    <View style={styles.form}>
      {formState.errors.root?.message ? (
        <Text color="danger" accessibilityRole="alert">
          {formState.errors.root.message}
        </Text>
      ) : null}

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
            textContentType="name"
          />
        )}
      />
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <TextField
            ref={field.ref}
            label="Email"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
          />
        )}
      />
      <Controller
        control={control}
        name="role"
        render={({ field }) => (
          <SegmentedControl
            label="Role"
            options={roleOptions}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />
      <Controller
        control={control}
        name="status"
        render={({ field }) => (
          <SegmentedControl
            label="Status"
            options={statusOptions}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />

      <Button
        title={user ? 'Save changes' : 'Add user'}
        loading={formState.isSubmitting}
        onPress={() => void submit()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: space.lg },
});
