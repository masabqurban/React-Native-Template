import { StyleSheet, View } from 'react-native';

import { capitalize } from '@/lib/format';
import { radius, space, useTheme, type ThemeColors } from '@/theme';

import { Text } from './text';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

const tones: Record<BadgeTone, [background: keyof ThemeColors, text: keyof ThemeColors]> = {
  neutral: ['background', 'muted'],
  primary: ['primarySoft', 'link'],
  success: ['successSoft', 'success'],
  warning: ['warningSoft', 'warning'],
  danger: ['dangerSoft', 'danger'],
};

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: BadgeTone }) {
  const { colors } = useTheme();
  const [background, text] = tones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: colors[background] }]}>
      <Text variant="caption" weight="600" color={text}>
        {capitalize(label)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
  },
});
