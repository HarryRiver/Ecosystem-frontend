/**
 * src/hooks/useCatalog.ts
 * ─────────────────────────────────────────────────────────────
 * SWR hooks cho Catalog công khai: Dịch vụ & Khung giờ.
 * Data được cache dài vì ít thay đổi.
 * ─────────────────────────────────────────────────────────────
 */

'use client';

import useSWR from 'swr';
import { getServices, getTimeSlots } from '@/features/booking-flow/services/catalog.service';
import { type ApiService, type TimeSlot } from '@/shared/types/api';

// ─── useServices ──────────────────────────────────────────────────────────────

interface UseServicesReturn {
  services: ApiService[] | undefined;
  isLoading: boolean;
  error: unknown;
}

export function useServices(): UseServicesReturn {
  const { data, isLoading, error } = useSWR<ApiService[]>(
    '/services',
    () => getServices(),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5 * 60 * 1000, // dedupe 5 phút
    },
  );

  return { services: data, isLoading, error };
}

// ─── useTimeSlots ─────────────────────────────────────────────────────────────

interface UseTimeSlotsReturn {
  timeSlots: TimeSlot[] | undefined;
  isLoading: boolean;
  error: unknown;
}

/**
 * @param date YYYY-MM-DD — truyền để BE trả kèm trạng thái is_full của từng slot.
 */
export function useTimeSlots(date?: string): UseTimeSlotsReturn {
  const key = date ? `/time-slots?date=${date}` : '/time-slots';

  const { data, isLoading, error } = useSWR<TimeSlot[]>(
    key,
    () => getTimeSlots(date),
    {
      revalidateOnFocus: false,
    },
  );

  return { timeSlots: data, isLoading, error };
}
