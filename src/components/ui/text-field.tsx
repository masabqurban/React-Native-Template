import { useId, type Ref } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type TextInputInstance,
  type TextInputProps,
} from 'react-native';

import { font, MIN_TOUCH_TARGET, radius, space, useTheme } from '@/theme';

import { Text } from './text';

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
  hint?: string;
  ref?: Ref<TextInputInstance>;
};

/** Labelled input with hint and error text, announced together by screen readers. */
export function TextField({ label, error, hint, style, ref, ...props }: TextFieldProps) {
  const { colors } = useTheme();
  const labelId = useId();
  const description = [hint, error].filter(Boolean).join('. ');

  return (
    <View style={styles.field}>
      <Text nativeID={labelId} variant="small" weight="500">
        {label}
      </Text>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        accessibilityLabelledBy={labelId}
        accessibilityHint={description || undefined}
        aria-invalid={Boolean(error)}
        placeholderTextColor={colors.muted}
        maxFontSizeMultiplier={1.6}
        style={[
          styles.input,
          {
            color: colors.text,
            backgroundColor: colors.card,
            borderColor: error ? colors.danger : colors.input,
          },
          style,
        ]}
        {...props}
      />
      {hint && !error ? (
        <Text variant="caption" color="muted">
          {hint}
        </Text>
      ) : null}
      {error ? (
        <Text variant="small" color="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: space.xs + 2 },
  input: {
    minHeight: MIN_TOUCH_TARGET + 4,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    fontSize: font.body,
  },
});
