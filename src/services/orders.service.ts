/**
 * src/services/orders.service.ts
 * ─────────────────────────────────────────────────────────────
 * Tất cả các lời gọi API liên quan đến đơn hàng của khách hàng.
 * Ref: API_Specs.md – Mục III.3, III.4 (Customer – Orders & Payment)
 * ─────────────────────────────────────────────────────────────
 */

import apiClient from '@/lib/apiClient';
import {
  type Order,
  type CreateOrderBody,
  type PaginatedData,
  type PaymentIntent,
  type QuoteBody,
  type QuoteResult,
} from '@/types/api';

// ─── POST /pricing/quote ─────────────────────────────────────────────────────

/**
 * Báo giá tạm tính. Gọi mỗi khi khách thay đổi giỏ hàng.
 * FE KHÔNG tự tính giá — chỉ hiển thị kết quả từ BE.
 *
 * Gợi ý: Wrap gọi hàm này trong debounce(500ms) ở component BookingModal.
 */
export async function getQuote(body: QuoteBody): Promise<QuoteResult> {
  const response = await apiClient.post<QuoteResult>('/pricing/quote', body);
  return response.data;
}

// ─── POST /orders ─────────────────────────────────────────────────────────────

/**
 * Tạo đơn hàng mới.
 * Hỗ trợ cả Guest (không cần token) và Member (có token).
 */
export async function createOrder(body: CreateOrderBody): Promise<Order> {
  const response = await apiClient.post<Order>('/orders', body);
  return response.data;
}

// ─── GET /me/orders ──────────────────────────────────────────────────────────

export interface GetMyOrdersParams {
  status?: string;
  page?: number;
  limit?: number;
}

/**
 * Lấy lịch sử đơn hàng của user đang đăng nhập.
 */
export async function getMyOrders(
  params?: GetMyOrdersParams,
): Promise<PaginatedData<Order>> {
  const response = await apiClient.get<PaginatedData<Order>>('/me/orders', {
    params,
  });
  return response.data;
}

// ─── GET /orders/:id ─────────────────────────────────────────────────────────

/**
 * Lấy chi tiết 1 đơn hàng (kèm order_items và timeline).
 */
export async function getOrderById(id: string): Promise<Order> {
  const response = await apiClient.get<Order>(`/orders/${id}`);
  return response.data;
}

// ─── POST /orders/:id/cancel ─────────────────────────────────────────────────

export interface CancelOrderBody {
  reason: string;
}

/**
 * Khách yêu cầu hủy đơn.
 */
export async function cancelOrder(
  id: string,
  body: CancelOrderBody,
): Promise<Order> {
  const response = await apiClient.post<Order>(`/orders/${id}/cancel`, body);
  return response.data;
}

// ─── POST /orders/:id/images ─────────────────────────────────────────────────

/**
 * Khách upload ảnh rác / đồ cồng kềnh trước khi vận chuyển.
 * Dùng FormData, `image_role` = 'before'.
 */
export async function uploadOrderImages(
  id: string,
  files: File[],
): Promise<{ urls: string[] }> {
  const form = new FormData();
  files.forEach((file) => form.append('images', file));
  form.append('image_role', 'before');

  const response = await apiClient.post<{ urls: string[] }>(
    `/orders/${id}/images`,
    form,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );
  return response.data;
}

// ─── POST /orders/:id/payment-intent ─────────────────────────────────────────

/**
 * Tạo link thanh toán online. FE redirect khách đến `payment_url`.
 */
export async function createPaymentIntent(id: string): Promise<PaymentIntent> {
  const response = await apiClient.post<PaymentIntent>(
    `/orders/${id}/payment-intent`,
  );
  return response.data;
}
