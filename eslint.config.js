// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    ignores: ['dist/*', '.expo/*', 'coverage/*', 'expo-env.d.ts'],
  },
  {
    // eslint-config-expo registers the @typescript-eslint plugin for TS files
    // only, so TS rules must be scoped too, or linting a .js file fails.
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // Architecture boundaries. Dependencies flow one way:
      //   app (routes) → features → shared (components, lib, theme, config)
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*/*'],
              message: "Import a feature through its public entry: '@/features/<name>'.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/components/**', 'src/lib/**', 'src/theme/**', 'src/config/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*', '@/app/*'],
              message: 'Shared code must not depend on features or routes.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*/*'],
              message: "Import a feature through its public entry: '@/features/<name>'.",
            },
            { group: ['@/app/*'], message: 'Features must not import from routes.' },
          ],
        },
      ],
    },
  },
]);
