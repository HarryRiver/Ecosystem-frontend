/**
 * src/hooks/useAdminMetrics.ts
 * ─────────────────────────────────────────────────────────────
 * SWR hook lấy thống kê Admin Dashboard.
 * ─────────────────────────────────────────────────────────────
 */

'use client';

import useSWR from 'swr';
import {
  getAdminMetrics,
  type MetricsParams,
} from '@/features/admin/services/admin.service';
import { type AdminMetrics } from '@/shared/types/api';

interface UseAdminMetricsReturn {
  metrics: AdminMetrics | undefined;
  isLoading: boolean;
  error: unknown;
  refresh: () => void;
}

export function useAdminMetrics(
  params?: MetricsParams,
): UseAdminMetricsReturn {
  const key = ['/admin/metrics', params];

  const { data, isLoading, error, mutate } = useSWR<AdminMetrics>(
    key,
    () => getAdminMetrics(params),
    {
      revalidateOnFocus: false,
      refreshInterval: 60_000, // tự refresh mỗi 1 phút
    },
  );

  return { metrics: data, isLoading, error, refresh: mutate };
}
