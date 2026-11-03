import { z } from 'zod';

export const userRoles = ['admin', 'editor', 'viewer'] as const;
export const userStatuses = ['active', 'invited', 'suspended'] as const;

/** Contract for a user as the API returns it. */
export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  role: z.enum(userRoles),
  status: z.enum(userStatuses),
  createdAt: z.iso.datetime(),
  lastActiveAt: z.iso.datetime().nullable(),
});

/** Create / edit form. The same schema validates the form and types the request body. */
export const userFormSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(100),
  email: z.email('Enter a valid email address.').trim().toLowerCase(),
  role: z.enum(userRoles, 'Choose a role.'),
  status: z.enum(userStatuses, 'Choose a status.'),
});

export type User = z.infer<typeof userSchema>;
export type UserRole = (typeof userRoles)[number];
export type UserStatus = (typeof userStatuses)[number];
export type UserFormInput = z.input<typeof userFormSchema>;
export type UserFormValues = z.output<typeof userFormSchema>;
export type UsersFilter = { q?: string; status?: UserStatus };
