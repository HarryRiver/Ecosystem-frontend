/**
 * src/services/catalog.service.ts
 * ─────────────────────────────────────────────────────────────
 * Catalog công khai (không cần auth): Dịch vụ & Khung giờ.
 * Ref: API_Specs.md – Mục III.2 (Customer – Catalog & Scheduling)
 * ─────────────────────────────────────────────────────────────
 */

import apiClient from '@/shared/lib/apiClient';
import { type ApiService, type TimeSlot } from '@/shared/types/api';

// ─── GET /services ────────────────────────────────────────────────────────────

/**
 * Lấy danh sách tất cả dịch vụ khả dụng cùng các variants.
 * Endpoint Public — không cần token.
 */
export async function getServices(): Promise<ApiService[]> {
  const response = await apiClient.get<ApiService[]>('/services');
  return response.data;
}

// ─── GET /time-slots ─────────────────────────────────────────────────────────

/**
 * Lấy danh sách khung giờ trống.
 * Truyền `date` (YYYY-MM-DD) để BE kèm trạng thái `is_full` cho từng slot.
 * Endpoint Public — không cần token.
 */
export async function getTimeSlots(date?: string): Promise<TimeSlot[]> {
  const response = await apiClient.get<TimeSlot[]>('/time-slots', {
    params: date ? { date } : undefined,
  });
  return response.data;
}
