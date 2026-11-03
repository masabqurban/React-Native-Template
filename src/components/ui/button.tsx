import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';

import { MIN_TOUCH_TARGET, radius, space, useTheme, type ThemeColors } from '@/theme';

import { Text } from './text';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

type ButtonProps = Omit<PressableProps, 'children'> & {
  title: string;
  variant?: Variant;
  loading?: boolean;
};

function colorsFor(variant: Variant, colors: ThemeColors) {
  switch (variant) {
    case 'primary':
      return { background: colors.primary, text: colors.primaryText, border: colors.primary };
    case 'danger':
      return { background: colors.dangerSoft, text: colors.danger, border: colors.dangerSoft };
    case 'secondary':
      return { background: colors.card, text: colors.text, border: colors.border };
    case 'ghost':
      return { background: 'transparent', text: colors.link, border: 'transparent' };
  }
}

export function Button({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const { colors } = useTheme();
  const tone = colorsFor(variant, colors);
  const isDisabled = Boolean(disabled) || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={(state) => [
        styles.base,
        { backgroundColor: tone.background, borderColor: tone.border },
        state.pressed && styles.pressed,
        isDisabled && styles.disabled,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}
    >
      {loading ? <ActivityIndicator color={tone.text} /> : null}
      <Text weight="600" style={{ color: tone.text }}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH_TARGET + 4,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.5 },
});
