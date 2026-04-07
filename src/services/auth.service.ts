/**
 * src/services/auth.service.ts
 * ─────────────────────────────────────────────────────────────
 * Tất cả các lời gọi API liên quan đến xác thực.
 * Ref: API_Specs.md – Mục II (Auth API)
 * ─────────────────────────────────────────────────────────────
 */

import apiClient, { saveToken, removeToken } from '@/lib/apiClient';
import {
  type AuthPayload,
  type LoginBody,
  type RegisterBody,
  type ApiUser,
} from '@/types/api';

// ─── Types internal ───────────────────────────────────────────────────────────

export type { AuthPayload };

// ─── POST /auth/register ─────────────────────────────────────────────────────

/**
 * Đăng ký tài khoản khách hàng mới.
 * Tự động lưu access_token sau khi đăng ký thành công.
 */
export async function register(body: RegisterBody): Promise<AuthPayload> {
  const response = await apiClient.post<AuthPayload>('/auth/register', body);
  const payload = response.data;
  saveToken(payload.access_token);
  return payload;
}

// ─── POST /auth/login ─────────────────────────────────────────────────────────

/**
 * Đăng nhập cho cả Customer và Admin.
 * `identity` = phone hoặc email.
 * Tự động lưu access_token sau khi login thành công.
 */
export async function login(body: LoginBody): Promise<AuthPayload> {
  const response = await apiClient.post<AuthPayload>('/auth/login', body);
  const payload = response.data;
  saveToken(payload.access_token);
  return payload;
}

// ─── POST /auth/logout ────────────────────────────────────────────────────────

/**
 * Đăng xuất. Xóa token cục bộ bất kể BE có trả lỗi hay không.
 */
export async function logout(): Promise<void> {
  try {
    await apiClient.post('/auth/logout');
  } finally {
    removeToken();
  }
}

// ─── GET /me ─────────────────────────────────────────────────────────────────

/**
 * Lấy thông tin user hiện tại từ token.
 */
export async function getMe(): Promise<ApiUser> {
  const response = await apiClient.get<ApiUser>('/me');
  return response.data;
}

// ─── PATCH /me ───────────────────────────────────────────────────────────────

export type UpdateMeBody = Partial<
  Pick<ApiUser, 'full_name' | 'phone' | 'email'>
>;

/**
 * Cập nhật thông tin cá nhân của user hiện tại.
 */
export async function updateMe(body: UpdateMeBody): Promise<ApiUser> {
  const response = await apiClient.patch<ApiUser>('/me', body);
  return response.data;
}
