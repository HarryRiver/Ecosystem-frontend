/**
 * src/hooks/useAdminOrders.ts
 * ─────────────────────────────────────────────────────────────
 * SWR hook cho danh sách đơn hàng ở Admin Panel.
 * ─────────────────────────────────────────────────────────────
 */

'use client';

import useSWR from 'swr';
import {
  getAdminOrders,
  getAdminOrderById,
  type GetAdminOrdersParams,
} from '@/features/admin/services/admin.service';
import { type Order, type PaginatedData } from '@/shared/types/api';

// ─── useAdminOrders ───────────────────────────────────────────────────────────

interface UseAdminOrdersReturn {
  data: PaginatedData<Order> | undefined;
  isLoading: boolean;
  error: unknown;
  refresh: () => void;
}

export function useAdminOrders(
  params?: GetAdminOrdersParams,
): UseAdminOrdersReturn {
  const key = ['/admin/orders', params];

  const { data, isLoading, error, mutate } = useSWR<PaginatedData<Order>>(
    key,
    () => getAdminOrders(params),
    {
      revalidateOnFocus: true,
      refreshInterval: 30_000, // tự refresh mỗi 30 giây
    },
  );

  return { data, isLoading, error, refresh: mutate };
}

// ─── useAdminOrder ────────────────────────────────────────────────────────────

interface UseAdminOrderReturn {
  order: Order | undefined;
  isLoading: boolean;
  error: unknown;
  refresh: () => void;
}

export function useAdminOrder(id: string | null): UseAdminOrderReturn {
  const { data, isLoading, error, mutate } = useSWR<Order>(
    id ? `/admin/orders/${id}` : null,
    () => getAdminOrderById(id!),
    {
      revalidateOnFocus: false,
    },
  );

  return { order: data, isLoading, error, refresh: mutate };
}
