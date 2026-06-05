/**
 * src/services/admin.service.ts
 * ─────────────────────────────────────────────────────────────
 * Tất cả API dành cho Admin Panel.
 * Ref: API_Specs.md – Mục IV (Admin API)
 *
 * LƯU Ý: Mọi endpoint ở đây yêu cầu token có role='admin'.
 * apiClient interceptor tự gắn token vào Header.
 * ─────────────────────────────────────────────────────────────
 */

import apiClient from '@/shared/lib/apiClient';
import {
  type AdminMetrics,
  type Order,
  type ApiService,
  type ServiceVariant,
  type TimeSlot,
  type ApiUser,
  type Payment,
  type Voucher,
  type Notification,
  type UnreadCount,
  type PaginatedData,
  type CreateVoucherBody,
  type OrderStatus,
} from '@/shared/types/api';

// ═══════════════════════════════════════════════════════════════
// I. DASHBOARD & THỐNG KÊ
// ═══════════════════════════════════════════════════════════════

export interface MetricsParams {
  date_from?: string; // YYYY-MM-DD
  date_to?: string;   // YYYY-MM-DD
}

/**
 * GET /admin/metrics
 * Lấy thống kê tổng quan (KPI, biểu đồ, top dịch vụ).
 */
export async function getAdminMetrics(
  params?: MetricsParams,
): Promise<AdminMetrics> {
  const response = await apiClient.get<AdminMetrics>('/admin/metrics', {
    params,
  });
  return response.data;
}

// ═══════════════════════════════════════════════════════════════
// II. QUẢN LÝ ĐƠN HÀNG
// ═══════════════════════════════════════════════════════════════

export interface GetAdminOrdersParams {
  search?: string;   // order_code hoặc phone
  status?: string;
  date_from?: string;
  date_to?: string;
  district?: string;
  page?: number;
  limit?: number;
}

/**
 * GET /admin/orders
 * Danh sách toàn bộ đơn hàng hệ thống (có filter).
 */
export async function getAdminOrders(
  params?: GetAdminOrdersParams,
): Promise<PaginatedData<Order>> {
  const response = await apiClient.get<PaginatedData<Order>>('/admin/orders', {
    params,
  });
  return response.data;
}

/**
 * GET /admin/orders/:id
 * Chi tiết đơn hàng (bao gồm internal_notes, assigned_staff).
 */
export async function getAdminOrderById(id: string): Promise<Order> {
  const response = await apiClient.get<Order>(`/admin/orders/${id}`);
  return response.data;
}

export interface UpdateAdminOrderBody {
  status?: OrderStatus;
  final_total?: number;
  adjustment_reason?: string;
  internal_notes?: string;
  assigned_staff?: string;
}

/**
 * PATCH /admin/orders/:id
 * Cập nhật thông tin đơn: trạng thái, giá cuối, note, nhân viên.
 */
export async function updateAdminOrder(
  id: string,
  body: UpdateAdminOrderBody,
): Promise<Order> {
  const response = await apiClient.patch<Order>(`/admin/orders/${id}`, body);
  return response.data;
}

/**
 * POST /admin/orders/:id/mark-no-show
 * Ghi nhận khách bùng đơn. BE tự +1 no_show_count của khách.
 */
export async function markOrderNoShow(id: string): Promise<Order> {
  const response = await apiClient.post<Order>(
    `/admin/orders/${id}/mark-no-show`,
  );
  return response.data;
}

// ═══════════════════════════════════════════════════════════════
// III. QUẢN LÝ DỊCH VỤ
// ═══════════════════════════════════════════════════════════════

export interface GetAdminServicesParams {
  search?: string;
  category?: string;
  active?: boolean;
  page?: number;
  limit?: number;
}

export async function getAdminServices(
  params?: GetAdminServicesParams,
): Promise<PaginatedData<ApiService>> {
  const response = await apiClient.get<PaginatedData<ApiService>>(
    '/admin/services',
    { params },
  );
  return response.data;
}

export interface CreateServiceBody {
  code: string;
  name: string;
  category: string;
  pricing_type: ApiService['pricing_type'];
  base_price: number;
  default_unit: string;
}

export async function createAdminService(
  body: CreateServiceBody,
): Promise<ApiService> {
  const response = await apiClient.post<ApiService>('/admin/services', body);
  return response.data;
}

export interface UpdateServiceBody {
  name?: string;
  base_price?: number;
  active?: boolean;
}

export async function updateAdminService(
  id: string,
  body: UpdateServiceBody,
): Promise<ApiService> {
  const response = await apiClient.patch<ApiService>(
    `/admin/services/${id}`,
    body,
  );
  return response.data;
}

export async function deleteAdminService(id: string): Promise<void> {
  await apiClient.delete(`/admin/services/${id}`);
}

// ═══════════════════════════════════════════════════════════════
// IV. QUẢN LÝ BIẾN THỂ DỊCH VỤ
// ═══════════════════════════════════════════════════════════════

export async function getServiceVariants(
  serviceId: string,
): Promise<ServiceVariant[]> {
  const response = await apiClient.get<ServiceVariant[]>(
    `/admin/services/${serviceId}/variants`,
  );
  return response.data;
}

export interface CreateVariantBody {
  label: string;
  price: number;
  unit: string;
}

export async function createServiceVariant(
  serviceId: string,
  body: CreateVariantBody,
): Promise<ServiceVariant> {
  const response = await apiClient.post<ServiceVariant>(
    `/admin/services/${serviceId}/variants`,
    body,
  );
  return response.data;
}

export interface UpdateVariantBody {
  label?: string;
  code?: string;
  size?: string;
  price?: number;
  unit?: string;
  active?: boolean;
}

export async function updateServiceVariant(
  variantId: string,
  body: UpdateVariantBody,
): Promise<ServiceVariant> {
  const response = await apiClient.patch<ServiceVariant>(
    `/admin/service-variants/${variantId}`,
    body,
  );
  return response.data;
}

export async function deleteServiceVariant(variantId: string): Promise<void> {
  await apiClient.delete(`/admin/service-variants/${variantId}`);
}

// ═══════════════════════════════════════════════════════════════
// V. QUẢN LÝ KHUNG GIỜ
// ═══════════════════════════════════════════════════════════════

export async function getAdminTimeSlots(): Promise<TimeSlot[]> {
  const response = await apiClient.get<TimeSlot[]>('/admin/time-slots');
  return response.data;
}

export interface CreateTimeSlotBody {
  start_time: string; // HH:mm
  end_time: string;   // HH:mm
  max_orders: number;
}

export async function createAdminTimeSlot(
  body: CreateTimeSlotBody,
): Promise<TimeSlot> {
  const response = await apiClient.post<TimeSlot>('/admin/time-slots', body);
  return response.data;
}

export interface UpdateTimeSlotBody {
  start_time?: string;
  end_time?: string;
  max_orders?: number;
  active?: boolean;
}

export async function updateAdminTimeSlot(
  id: string,
  body: UpdateTimeSlotBody,
): Promise<TimeSlot> {
  const response = await apiClient.patch<TimeSlot>(
    `/admin/time-slots/${id}`,
    body,
  );
  return response.data;
}

// ═══════════════════════════════════════════════════════════════
// VI. QUẢN LÝ NGƯỜI DÙNG
// ═══════════════════════════════════════════════════════════════

export interface GetAdminUsersParams {
  role?: string;
  search?: string;
  is_blacklisted?: boolean;
  page?: number;
  limit?: number;
}

export async function getAdminUsers(
  params?: GetAdminUsersParams,
): Promise<PaginatedData<ApiUser>> {
  const response = await apiClient.get<PaginatedData<ApiUser>>('/admin/users', {
    params,
  });
  return response.data;
}

export async function getAdminUserById(id: string): Promise<ApiUser> {
  const response = await apiClient.get<ApiUser>(`/admin/users/${id}`);
  return response.data;
}

export interface UpdateAdminUserBody {
  prepaid_required?: boolean;
  is_blacklisted?: boolean;
  status?: ApiUser['status'];
}

export async function updateAdminUser(
  id: string,
  body: UpdateAdminUserBody,
): Promise<ApiUser> {
  const response = await apiClient.patch<ApiUser>(`/admin/users/${id}`, body);
  return response.data;
}

// ═══════════════════════════════════════════════════════════════
// VII. QUẢN LÝ PAYMENT
// ═══════════════════════════════════════════════════════════════

export interface GetAdminPaymentsParams {
  method?: string;
  status?: string;
  provider_ref?: string;
  page?: number;
  limit?: number;
}

export async function getAdminPayments(
  params?: GetAdminPaymentsParams,
): Promise<PaginatedData<Payment>> {
  const response = await apiClient.get<PaginatedData<Payment>>(
    '/admin/payments',
    { params },
  );
  return response.data;
}

// ═══════════════════════════════════════════════════════════════
// VIII. QUẢN LÝ VOUCHER
// ═══════════════════════════════════════════════════════════════

export async function getAdminVouchers(): Promise<Voucher[]> {
  const response = await apiClient.get<Voucher[]>('/admin/vouchers');
  return response.data;
}

export async function createAdminVoucher(
  body: CreateVoucherBody,
): Promise<Voucher> {
  const response = await apiClient.post<Voucher>('/admin/vouchers', body);
  return response.data;
}

export interface UpdateVoucherBody {
  value?: number;
  active?: boolean;
}

export async function updateAdminVoucher(
  id: string,
  body: UpdateVoucherBody,
): Promise<Voucher> {
  const response = await apiClient.patch<Voucher>(
    `/admin/vouchers/${id}`,
    body,
  );
  return response.data;
}

// ═══════════════════════════════════════════════════════════════
// IX. QUẢN LÝ NOTIFICATIONS (Admin)
// ═══════════════════════════════════════════════════════════════

export async function getAdminNotifications(): Promise<Notification[]> {
  const response = await apiClient.get<Notification[]>('/admin/notifications');
  return response.data;
}

export async function getAdminUnreadCount(): Promise<UnreadCount> {
  const response = await apiClient.get<UnreadCount>(
    '/admin/notifications/unread-count',
  );
  return response.data;
}

export async function markAdminNotificationRead(id: number): Promise<void> {
  await apiClient.patch(`/admin/notifications/${id}/read`);
}

export interface SendBroadcastBody {
  title: string;
  body: string;
  /** Nếu không truyền → gửi tất cả user */
  user_id?: string;
}

export async function sendAdminNotification(
  body: SendBroadcastBody,
): Promise<void> {
  await apiClient.post('/admin/notifications/send', body);
}

// ═══════════════════════════════════════════════════════════════
// X. QUẢN LÝ REVIEWS (Admin)
// ═══════════════════════════════════════════════════════════════

export async function getAdminReviews(): Promise<any[]> {
  const response = await apiClient.get<any[]>('/reviews');
  return response.data;
}

export async function createAdminReview(payload: any): Promise<any> {
  const response = await apiClient.post<any>('/reviews', payload);
  return response.data;
}

export async function updateAdminReview(id: string | number, payload: any): Promise<any> {
  const response = await apiClient.patch<any>(`/reviews/${id}`, payload);
  return response.data;
}

export async function deleteAdminReview(id: string | number): Promise<void> {
  await apiClient.delete(`/reviews/${id}`);
}

