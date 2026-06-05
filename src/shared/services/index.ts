/**
 * src/services/index.ts
 * ─────────────────────────────────────────
 * Barrel export cho tất cả services.
 * Import gọn: import { login, getAdminOrders } from '@/shared/services';
 * ─────────────────────────────────────────
 */

export * from '@/features/auth/services/auth.service';
export * from '@/features/booking-flow/services/orders.service';
export * from '@/features/booking-flow/services/catalog.service';
export * from './notifications.service';
export * from '@/features/admin/services/admin.service';
export * from './vouchers.service';
