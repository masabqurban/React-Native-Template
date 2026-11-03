/**
 * Design tokens. Components read semantic names (`colors.card`, `colors.muted`)
 * from `useTheme()`, never raw hex values, so a rebrand or a new theme only
 * touches this file. Same brand palette as the web templates.
 */
const palette = {
  brand50: '#EEF4FF',
  brand300: '#93B4FD',
  brand500: '#3B65F6',
  brand600: '#2546EB',
  brand950: '#171D54',
};

export const lightColors = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  text: '#0F172A',
  muted: '#475569',
  border: '#E2E8F0',
  input: '#CBD5E1',
  primary: palette.brand600,
  primaryText: '#FFFFFF',
  primarySoft: palette.brand50,
  link: palette.brand600,
  danger: '#C81E1E',
  dangerSoft: '#FDECEC',
  success: '#047857',
  successSoft: '#E7F6EF',
  warning: '#92400E',
  warningSoft: '#FDF3E2',
};

export type ThemeColors = typeof lightColors;

export const darkColors: ThemeColors = {
  background: '#0B1120',
  card: '#111827',
  text: '#E2E8F0',
  muted: '#94A3B8',
  border: '#1F2A3D',
  input: '#334155',
  primary: palette.brand500,
  primaryText: '#FFFFFF',
  primarySoft: palette.brand950,
  link: palette.brand300,
  danger: '#F87171',
  dangerSoft: '#3B1218',
  success: '#34D399',
  successSoft: '#0E2E25',
  warning: '#FBBF24',
  warningSoft: '#33260B',
};

/** 4-point spacing scale. */
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;

/** Sizes scale with the user's font-size setting (allowFontScaling stays on). */
export const font = {
  caption: 12,
  small: 14,
  body: 16,
  title: 20,
  heading: 28,
} as const;

/** Apple and Material both recommend touch targets of at least 44–48pt. */
export const MIN_TOUCH_TARGET = 44;
