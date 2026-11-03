import { z } from 'zod';

/**
 * Validated build-time environment. Only `EXPO_PUBLIC_*` variables are
 * inlined into the bundle, and anything in them can be read by whoever has
 * the app, so they must never hold secrets. Each must be read with a literal
 * `process.env.EXPO_PUBLIC_X` expression so Expo can inline it.
 */
const envSchema = z.object({
  EXPO_PUBLIC_API_URL: z
    .url()
    .optional()
    .transform((url) => url?.replace(/\/+$/, '')),
  EXPO_PUBLIC_ENABLE_MOCKS: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
});

/** An empty `KEY=` line means "not set", so defaults still apply. */
const read = (value: string | undefined) => (value === '' ? undefined : value);

export const env = envSchema.parse({
  EXPO_PUBLIC_API_URL: read(process.env.EXPO_PUBLIC_API_URL),
  EXPO_PUBLIC_ENABLE_MOCKS: read(process.env.EXPO_PUBLIC_ENABLE_MOCKS),
});

/**
 * The mock API is on until a real API is configured, so a fresh clone runs
 * with no backend, and a build pointed at an API never mocks by accident.
 */
export const mocksEnabled = env.EXPO_PUBLIC_ENABLE_MOCKS ?? !env.EXPO_PUBLIC_API_URL;

/** Requests are served in-app when mocking, so any base URL works. */
export const apiBaseUrl = env.EXPO_PUBLIC_API_URL ?? 'https://mock.api.local/api/v1';
