/**
 * src/hooks/useOrders.ts
 * ─────────────────────────────────────────────────────────────
 * SWR hooks cho đơn hàng của khách hàng.
 *
 * - useMyOrders: Danh sách lịch sử đơn hàng cá nhân.
 * - useOrder: Chi tiết 1 đơn hàng.
 * ─────────────────────────────────────────────────────────────
 */

'use client';

import useSWR from 'swr';
import {
  getMyOrders,
  getOrderById,
  type GetMyOrdersParams,
} from '@/features/booking-flow/services/orders.service';
import { type Order, type PaginatedData } from '@/shared/types/api';

// ─── useMyOrders ──────────────────────────────────────────────────────────────

interface UseMyOrdersReturn {
  data: PaginatedData<Order> | undefined;
  isLoading: boolean;
  error: unknown;
  refresh: () => void;
}

export function useMyOrders(params?: GetMyOrdersParams): UseMyOrdersReturn {
  // SWR key bao gồm params để cache riêng biệt
  const key = params ? ['/me/orders', params] : '/me/orders';

  const { data, isLoading, error, mutate } = useSWR<PaginatedData<Order>>(
    key,
    () => getMyOrders(params),
    {
      revalidateOnFocus: false,
    },
  );

  return { data, isLoading, error, refresh: mutate };
}

// ─── useOrder ─────────────────────────────────────────────────────────────────

interface UseOrderReturn {
  order: Order | undefined;
  isLoading: boolean;
  error: unknown;
  refresh: () => void;
}

export function useOrder(id: string | null): UseOrderReturn {
  const { data, isLoading, error, mutate } = useSWR<Order>(
    id ? `/orders/${id}` : null,
    () => getOrderById(id!),
    {
      revalidateOnFocus: false,
    },
  );

  return { order: data, isLoading, error, refresh: mutate };
}
