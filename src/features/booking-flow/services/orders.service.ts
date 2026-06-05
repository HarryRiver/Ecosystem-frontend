/**
 * src/services/orders.service.ts
 * ─────────────────────────────────────────────────────────────
 * Tất cả các lời gọi API liên quan đến đơn hàng của khách hàng.
 * Ref: API_Specs.md – Mục III.3, III.4 (Customer – Orders & Payment)
 * ─────────────────────────────────────────────────────────────
 */

import apiClient from '@/shared/lib/apiClient';
import {
  type Order,
  type CreateOrderBody,
  type PaginatedData,
  type PaymentIntent,
  type QuoteBody,
  type QuoteResult,
} from '@/shared/types/api';

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
 * Khách upload trực tiếp ảnh rác / đồ cồng kềnh lên Cloudinary (Cách 2)
 * sau đó đẩy URL trả về xuống Backend theo dạng chuẩn JSON.
 */
export async function uploadOrderImages(
  id: string,
  files: File[],
): Promise<{ urls: string[] }> {
  // Lấy Cloud Name và Upload Preset từ Env hoặc có thể tuỳ chọn hardcode tại đây
  // Vì hiện tại NextJS dùng NEXT_PUBLIC_...
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    console.error("Chưa cấu hình NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME hoặc NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET");
    throw new Error('Chưa cấu hình máy chủ lưu trữ ảnh Cloudinary trong hệ thống.');
  }

  const uploadedUrls: string[] = [];

  // Tải từng ảnh lên Cloudinary
  for (const file of files) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset); // Unsigned preset

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Cloudinary Upload lỗi: ${err.error?.message || res.statusText}`);
    }

    const data = await res.json();
    uploadedUrls.push(data.secure_url);
  }

  // Khai báo payload như BE mong đợi: @Body('images') images: CreateOrderImageDto[]
  const payload = {
    images: uploadedUrls.map(url => ({
      file_url: url,
      image_role: 'customer_upload'
    }))
  };

  // Gửi mảng JSON xuống API backend
  // Vì request mặc định của axios là application/json, BE sẽ nhận dạng đúng
  await apiClient.post(`/orders/${id}/images`, payload);

  return { urls: uploadedUrls };
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
