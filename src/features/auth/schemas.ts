import { z } from 'zod';

import { tokensSchema } from '@/lib/api';

/** The signed-in user, as `GET /me` and `POST /auth/login` return it. Unknown keys are stripped. */
export const sessionUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  role: z.enum(['admin', 'editor', 'viewer']),
});

export const loginResultSchema = tokensSchema.extend({ user: sessionUserSchema });

export const signInSchema = z.object({
  email: z.email('Enter a valid email address.').trim().toLowerCase(),
  password: z.string().min(1, 'Enter your password.'),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(100),
  email: z.email('Enter a valid email address.').trim().toLowerCase(),
});

export type SessionUser = z.infer<typeof sessionUserSchema>;
export type SignInInput = z.input<typeof signInSchema>;
export type SignInValues = z.output<typeof signInSchema>;
export type ProfileValues = z.output<typeof profileSchema>;
