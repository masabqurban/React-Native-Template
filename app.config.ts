import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * One codebase, three installable variants. Each has its own name and bundle
 * identifier, so development, preview and production builds can live side by
 * side on one device. EAS sets APP_VARIANT per build profile (see eas.json).
 */
type Variant = 'development' | 'preview' | 'production';

const variant: Variant =
  process.env.APP_VARIANT === 'development' || process.env.APP_VARIANT === 'preview'
    ? process.env.APP_VARIANT
    : 'production';

// PLACEHOLDER identity: replace "Acme" and "com.example.acme" with your own.
const variants = {
  development: { name: 'Acme (Dev)', id: 'com.example.acme.dev' },
  preview: { name: 'Acme (Preview)', id: 'com.example.acme.preview' },
  production: { name: 'Acme', id: 'com.example.acme' },
} as const satisfies Record<Variant, { name: string; id: string }>;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: variants[variant].name,
  slug: 'react-native-template',
  version: '1.0.0',
  scheme: 'acme',
  orientation: 'portrait',
  icon: './assets/icon.png',
  // Follow the system theme; the app also lets users override it.
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: variants[variant].id,
    supportsTablet: true,
    config: { usesNonExemptEncryption: false },
  },
  android: {
    package: variants[variant].id,
    adaptiveIcon: {
      backgroundColor: '#2546EB',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: true,
  },
  web: {
    favicon: './assets/favicon.png',
    output: 'single',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 160,
        backgroundColor: '#FFFFFF',
        dark: { image: './assets/splash-icon.png', backgroundColor: '#0B1120' },
      },
    ],
  ],
  experiments: {
    // `<Link href>` and `router.push` are checked against the real routes.
    typedRoutes: true,
  },
  extra: {
    variant,
  },
});
