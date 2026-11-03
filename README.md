# React Native Template

A production-grade **React Native + TypeScript** starter built on **Expo SDK 58** and **Expo Router**. It ships as a working mobile admin app (sign-in, dashboard, user management, settings) for iOS, Android and web, and runs with **zero setup** thanks to a built-in mock API.

![Expo](https://img.shields.io/badge/Expo-SDK_58-000020?logo=expo)
![React Native](https://img.shields.io/badge/React_Native-0.88-61dafb?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)
![Platforms](https://img.shields.io/badge/platforms-iOS%20%7C%20Android%20%7C%20web-lightgrey)
![License: MIT](https://img.shields.io/badge/License-MIT-green)

> All data in this repository (the "Acme" brand, users, emails and figures) is placeholder data.
> It's the mobile client of the [Node.js Template](https://github.com/masabqurban/Node.js-Template) and shares its API contract with the [React.js Template](https://github.com/masabqurban/React.js-Template).

## Contents

- [Highlights](#highlights)
- [Getting started](#getting-started)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Architecture](#architecture)
- [Authentication and security](#authentication-and-security)
- [Data fetching and offline behaviour](#data-fetching-and-offline-behaviour)
- [Accessibility](#accessibility)
- [Testing](#testing)
- [Builds, releases and updates](#builds-releases-and-updates)
- [Use with the Node.js Template](#use-with-the-nodejs-template)
- [Customising the template](#customising-the-template)

## Highlights

| Area              | What's included                                                                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Navigation**    | Expo Router (file-based, typed routes), tabs plus nested stacks, modal routes, deep links, `Stack.Protected` auth guards                                           |
| **Data**          | TanStack Query with infinite scrolling, pull to refresh, refetch on app foreground, pause while offline, and a fetch client that validates every response with Zod |
| **Forms**         | react-hook-form + Zod; keyboard-aware screens; server errors mapped onto the right field                                                                           |
| **Auth**          | Access token in memory, refresh token in the iOS Keychain / Android Keystore, single-flight refresh, session restored behind the splash screen                     |
| **UI**            | Typed design tokens, light / dark / system theme, FlashList for long lists, no UI kit lock-in                                                                      |
| **Accessibility** | Roles, labels and states on every control, 44pt touch targets, Dynamic Type support, screen-reader-friendly chart and alerts                                       |
| **Quality**       | Strict TypeScript, ESLint (`eslint-config-expo`) with import boundaries, Prettier, Jest + React Native Testing Library, Maestro flows, `expo-doctor` in CI         |
| **Delivery**      | EAS build profiles (development, preview, production) with separate app IDs, OTA update channels, CI that bundles all three platforms                              |

## Getting started

Requirements: **Node.js 22+** (24 recommended, see `.nvmrc`), and either the **Expo Go** app on a phone, an iOS simulator or an Android emulator.

```bash
npm install
npm start
```

Scan the QR code with Expo Go, or press `i` (iOS), `a` (Android) or `w` (web). Sign in with the demo account:

| Email              | Password      |
| ------------------ | ------------- |
| `demo@example.com` | `password123` |

No `.env` is needed: without `EXPO_PUBLIC_API_URL`, the app runs against its built-in mock API.

## Scripts

| Command                                         | Description                                                                  |
| ----------------------------------------------- | ---------------------------------------------------------------------------- |
| `npm start`                                     | Start the dev server (`ios` / `android` / `web` to open a platform directly) |
| `npm run lint`                                  | Lint with `expo lint`                                                        |
| `npm run typecheck`                             | Type-check                                                                   |
| `npm run test` / `test:watch` / `test:coverage` | Jest + React Native Testing Library                                          |
| `npm run format` / `format:check`               | Format with Prettier                                                         |
| `npm run doctor`                                | `expo-doctor`: dependency and config health checks                           |
| `npm run check`                                 | Lint, type check, tests and formatting in one go                             |

## Project structure

```text
src/
├── app/                      Routes (Expo Router): every file here is a screen
│   ├── _layout.tsx           Providers, splash screen, auth guards, error boundary
│   ├── sign-in.tsx
│   ├── user-form.tsx         Modal: create / edit a user
│   ├── +not-found.tsx        Unknown deep links
│   └── (app)/                Signed-in tab bar
│       ├── index.tsx         Dashboard
│       ├── settings.tsx
│       └── users/            Nested stack: list → [id] detail
├── features/                 Product features, each with a public index.ts
│   ├── auth/                 api · schemas · session store · sign-in form
│   ├── dashboard/
│   ├── settings/
│   └── users/                infinite queries · mutations · screens · form
├── components/               Shared UI: ui/ primitives, loading / empty / error states
├── theme/                    Design tokens and light / dark / system theme
├── lib/                      api/ (client, tokens, query client), dialogs, formatting
├── config/env.ts             Validated EXPO_PUBLIC_* environment
├── mocks/                    In-app mock API (same contract as the Node.js Template)
└── test/                     Jest setup, helpers, navigation integration test
app.config.ts                 Dynamic config: dev / preview / production variants
eas.json                      Build profiles and update channels
.maestro/                     End-to-end flows for real devices
```

## Architecture

**Dependencies flow one way: `app (routes) → features → shared`.** ESLint enforces it.

- **Routes are thin.** Files in `src/app` read params and the session, then render a feature screen. Keep everything else out of `src/app`: every file there becomes a route and is bundled into the app (tests included).
- **Features have a public API.** Import `@/features/users`, never its internals.
- **The session lives outside React** (`useSyncExternalStore`), so the root layout, guards and any module can read it without provider re-renders.
- **One HTTP client** validates every response with Zod, normalises errors into `ApiError`, and handles timeouts, cancellation and token refresh. It builds URLs and timeouts by hand, because React Native's `URL` and `AbortSignal.timeout` have historically been incomplete.

## Authentication and security

| Concern       | Approach                                                                                                                                                 |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Refresh token | `expo-secure-store` (iOS Keychain / Android Keystore), `WHEN_UNLOCKED_THIS_DEVICE_ONLY`: encrypted, never in AsyncStorage, not restored to other devices |
| Access token  | In memory only                                                                                                                                           |
| App launch    | The splash screen stays up while the session is restored, so there's no flash of the sign-in screen                                                      |
| Expired token | One refresh on 401, shared by concurrent requests so they don't trip the server's refresh-token reuse detection                                          |
| Guards        | `Stack.Protected` swaps the available screens when the session changes. Client-side only: the API authorises every request                               |
| Secrets       | Nothing secret in `EXPO_PUBLIC_*`: those values ship inside the app bundle                                                                               |
| Web           | `expo-secure-store` has no web support, so the web build keeps the refresh token in tab-scoped `sessionStorage`                                          |

## Data fetching and offline behaviour

- **Infinite lists:** `useInfiniteQuery` + FlashList, loading the next page as you scroll, with pull to refresh.
- **Mobile-aware caching:** TanStack Query is wired to `AppState` (refetch stale data when the app returns to the foreground) and NetInfo (pause requests offline, resume when back online).
- **Debounced search**, filter chips, and no automatic retries on 4xx errors or on writes.
- **Error boundary:** a crash in any screen shows a recoverable error screen instead of closing the app.

## Accessibility

- Every control has an `accessibilityRole`, a label and its state: segmented controls are radio groups with `checked`, and buttons expose `disabled` and `busy`.
- Touch targets are at least 44pt, and text scales with the system font size (capped at 1.6× so layouts hold).
- Form errors are announced through live regions, and sign-in errors are alerts.
- The chart is a single element with a spoken summary, because bars mean nothing to a screen reader.
- Tests query by role and label, the way assistive technology sees the app.

## Testing

```bash
npm run test
```

**25 tests** (Jest + React Native Testing Library) cover:

- the HTTP client: validation, errors, timeouts, refresh and retry;
- the mock API contract;
- the sign-in, user form, user detail and dashboard screens;
- a **navigation integration test** over the real `src/app` routes with `expo-router/testing-library`: the auth redirect, sign-in, tabs and the users list.

**End to end on devices:** the `.maestro/` flows run with [Maestro](https://maestro.dev) against an installed development or preview build (`maestro test .maestro`). They need a simulator or device, so CI doesn't run them by default.

## Builds, releases and updates

`app.config.ts` defines three variants with their own name and bundle ID, so they can be installed side by side:

| Profile       | App            | ID                         | Use                                            |
| ------------- | -------------- | -------------------------- | ---------------------------------------------- |
| `development` | Acme (Dev)     | `com.example.acme.dev`     | Development client with native debugging       |
| `preview`     | Acme (Preview) | `com.example.acme.preview` | Internal testers (TestFlight / internal track) |
| `production`  | Acme           | `com.example.acme`         | The stores                                     |

```bash
npx eas-cli@latest build --profile preview --platform all
npx eas-cli@latest update --channel preview --message "Fix typo"   # over-the-air JS update
npx eas-cli@latest submit --profile production --platform ios
```

Each profile publishes to its own update channel, and app version numbers are managed remotely and auto-incremented for production. Run `npx eas-cli@latest init` once to link the project to your Expo account.

**Web:** `npx expo export --platform web` produces a static single-page app in `dist/`. The host must rewrite unknown paths to `index.html`; `vercel.json` already does this.

### Environment variables

| Variable                   | Default               | Description                                                 |
| -------------------------- | --------------------- | ----------------------------------------------------------- |
| `EXPO_PUBLIC_API_URL`      | (none)                | Base URL of your API, e.g. `https://api.example.com/api/v1` |
| `EXPO_PUBLIC_ENABLE_MOCKS` | on without an API URL | Force the mock API on or off                                |
| `APP_VARIANT`              | `production`          | Set by EAS per profile (see `eas.json`)                     |

## Use with the Node.js Template

The app speaks the same contract as the [Node.js Template](https://github.com/masabqurban/Node.js-Template):

```bash
# in Node.js-Template
CORS_ORIGINS=http://localhost:8081 npm run dev
# here (copy .env.example to .env.local)
EXPO_PUBLIC_API_URL=http://localhost:4000/api/v1 npm start
```

On an Android emulator, use `http://10.0.2.2:4000/api/v1`. On a physical phone, use your computer's LAN IP.

## Customising the template

1. **Identity:** rename the app, `scheme` and bundle IDs in `app.config.ts`, and replace the images in `assets/`.
2. **Brand:** edit the tokens in `src/theme/tokens.ts`.
3. **Connect your API:** set `EXPO_PUBLIC_API_URL` and adjust the Zod schemas in each feature.
4. **Add a screen:** create `src/features/<name>/` with an `index.ts`, then add a route file under `src/app/`. Typed routes regenerate when the dev server runs.
5. **Native modules:** install with `npx expo install <package>` (it picks SDK-compatible versions). Libraries that aren't in Expo Go need a development build: `npx eas-cli@latest build --profile development`.

## License

[MIT](./LICENSE)
