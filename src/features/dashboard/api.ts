import { queryOptions } from '@tanstack/react-query';
import { z } from 'zod';

import { api, dataEnvelope } from '@/lib/api';

export const dashboardSummarySchema = z.object({
  stats: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      value: z.number(),
      /** Ratio versus the previous period: 0.12 = +12%. */
      change: z.number(),
    }),
  ),
  signups: z.array(z.object({ month: z.string(), count: z.number().int().min(0) })),
});

export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;

/** `GET /dashboard/summary` */
export function dashboardSummaryQueryOptions() {
  return queryOptions({
    queryKey: ['dashboard', 'summary'],
    queryFn: async ({ signal }) =>
      (
        await api.get('/dashboard/summary', {
          schema: dataEnvelope(dashboardSummarySchema),
          signal,
        })
      ).data,
  });
}
