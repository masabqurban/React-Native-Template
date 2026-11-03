import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { font, useTheme, type ThemeColors } from '@/theme';

const variants = {
  heading: { fontSize: font.heading, fontWeight: '700', letterSpacing: -0.5 },
  title: { fontSize: font.title, fontWeight: '600' },
  body: { fontSize: font.body },
  small: { fontSize: font.small },
  caption: { fontSize: font.caption },
} as const;

type TextProps = RNTextProps & {
  variant?: keyof typeof variants;
  color?: keyof ThemeColors;
  weight?: '400' | '500' | '600' | '700';
};

/**
 * Themed text. Font scaling stays on so Dynamic Type and Android font size
 * settings are respected; `maxFontSizeMultiplier` keeps layouts from breaking
 * at the very largest sizes.
 */
export function Text({ variant = 'body', color = 'text', weight, style, ...props }: TextProps) {
  const { colors } = useTheme();
  return (
    <RNText
      maxFontSizeMultiplier={1.6}
      style={[variants[variant], { color: colors[color] }, weight && { fontWeight: weight }, style]}
      {...props}
    />
  );
}
