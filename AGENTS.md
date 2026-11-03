# Agent instructions

This is an Expo (SDK 58) React Native app with Expo Router. Read `README.md` and `CONTRIBUTING.md` first.

## Expo changes every SDK: check the docs

Before using any Expo, EAS or React Native API, read the versioned docs for the SDK in `package.json` (`https://docs.expo.dev/versions/v58.0.0/`) or the index at https://docs.expo.dev/llms.txt. Don't rely on memory. Findings from building this template:

- `Tabs` is imported from `expo-router/tabs`. `Stack`, `ThemeProvider`, `DarkTheme` and `DefaultTheme` come from `expo-router`.
- `Stack.Protected` takes `guard` and, since SDK 58, `redirectTo`.
- `renderRouter` from `expo-router/testing-library` is async. In React Native Testing Library 14, `render` and `fireEvent.*` are async too: always `await` them.
- TypeScript 6 no longer includes every `@types/*` package by default (see `types` in `tsconfig.json`).

## Commands

```bash
npx expo install <package>   # ALWAYS use instead of npm install for app dependencies
npm run check                # lint, typecheck, tests, formatting
npx expo-doctor              # dependency and config health
npx expo export --platform ios --platform android --platform web   # bundle check
```

## Rules

- Routes live in `src/app/`; keep non-route code (and tests) out of it.
- `ios/` and `android/` are generated (Continuous Native Generation). Never edit them; configure native behaviour in `app.config.ts`.
- Every API call goes through `api` from `@/lib/api` with a Zod schema; add the matching route in `src/mocks/mock-fetch.ts`.
- Use `confirm()` / `notify()` from `@/lib/dialogs` instead of `Alert.alert` (it is a no-op on web).
