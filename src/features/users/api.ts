import {
  infiniteQueryOptions,
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { z } from 'zod';

import { api, dataEnvelope, paginatedEnvelope } from '@/lib/api';

import { userSchema, type User, type UserFormValues, type UsersFilter } from './schemas';

const PAGE_SIZE = 20;

/** Query keys in one place, so invalidation targets exactly the right data. */
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filter: UsersFilter) => [...userKeys.lists(), filter] as const,
  detail: (id: string) => [...userKeys.all, 'detail', id] as const,
};

/** `GET /users`, page by page: the list loads more as the user scrolls. */
export function usersInfiniteQueryOptions(filter: UsersFilter) {
  return infiniteQueryOptions({
    queryKey: userKeys.list(filter),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      api.get('/users', {
        schema: paginatedEnvelope(userSchema),
        query: { ...filter, page: pageParam, pageSize: PAGE_SIZE },
        signal,
      }),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
  });
}

/** `GET /users/:id` */
export function userQueryOptions(id: string) {
  return queryOptions({
    queryKey: userKeys.detail(id),
    queryFn: async ({ signal }) =>
      (
        await api.get(`/users/${encodeURIComponent(id)}`, {
          schema: dataEnvelope(userSchema),
          signal,
        })
      ).data,
  });
}

export function useSaveUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: UserFormValues }) => {
      const options = { schema: dataEnvelope(userSchema), body: values };
      const res = id
        ? await api.patch(`/users/${encodeURIComponent(id)}`, options)
        : await api.post('/users', options);
      return res.data;
    },
    onSuccess: async (user) => {
      queryClient.setQueryData(userKeys.detail(user.id), user);
      await queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (user: User) =>
      api.delete(`/users/${encodeURIComponent(user.id)}`, { schema: z.undefined() }),
    onSuccess: async (_data, user) => {
      // Stale, not removed: the detail screen may still be mounted for a moment.
      void queryClient.invalidateQueries({
        queryKey: userKeys.detail(user.id),
        refetchType: 'none',
      });
      await queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}
