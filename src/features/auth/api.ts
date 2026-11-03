import { z } from 'zod';

import { api, dataEnvelope, tokenStore } from '@/lib/api';

import {
  loginResultSchema,
  sessionUserSchema,
  type ProfileValues,
  type SignInValues,
} from './schemas';

/** `POST /auth/login`: email + password → tokens + user. */
export async function signIn(values: SignInValues) {
  const { data } = await api.post('/auth/login', {
    schema: dataEnvelope(loginResultSchema),
    body: values,
  });
  await tokenStore.setTokens(data);
  return data.user;
}

/** `GET /me`: the current user. */
export async function fetchMe() {
  return (await api.get('/me', { schema: dataEnvelope(sessionUserSchema) })).data;
}

/** `PATCH /me`: update the signed-in user's own profile. */
export async function updateMe(values: ProfileValues) {
  return (await api.patch('/me', { schema: dataEnvelope(sessionUserSchema), body: values })).data;
}

/** `POST /auth/logout`: revoke the refresh token on the server. */
export async function signOutRemote(refreshToken: string) {
  await api.post('/auth/logout', { schema: z.undefined(), body: { refreshToken } });
}
