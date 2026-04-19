/**
 * src/services/auth.service.ts
 * ─────────────────────────────────────────────────────────────
 * Tất cả các lời gọi API liên quan đến xác thực.
 * Ref: API_Specs.md – Mục II (Auth API)
 * ─────────────────────────────────────────────────────────────
 */

import apiClient, { saveToken, removeToken } from '@/lib/apiClient';
import {
  type LoginPayload,
  type RegisterPayload,
  type LoginBody,
  type RegisterBody,
  type ApiUser,
  type SendOtpBody,
  type VerifyOtpBody,
  type ChangePasswordBody,
  type VerifyOtpResponse,
} from '@/types/api';

// ─── Types internal ───────────────────────────────────────────────────────────

export type { LoginPayload as AuthPayload };

// ─── POST /auth/register ─────────────────────────────────────────────────────

/**
 * Đăng ký tài khoản khách hàng mới.
 */
export async function register(body: RegisterBody): Promise<RegisterPayload> {
  const response = await apiClient.post<RegisterPayload>('/auth/register', body);
  const payload = response.data;
  // Lưu token nếu có (trường hợp BE cấu hình đăng ký xong login luôn, 
  // nhưng thường flow OTP sẽ chưa có token ở bước này)
  if (payload.access_token) {
    saveToken(payload.access_token);
  }
  return payload;
}

// ─── OTP ──────────────────────────────────────────────────────────────────────

/**
 * Gửi mã OTP xác thực email.
 */
export async function sendOtp(body: SendOtpBody): Promise<string> {
  const response = await apiClient.post<string>('/auth/send-otp', body);
  return response.data;
}

/**
 * Xác thực mã OTP để kích hoạt tài khoản.
 */
export async function verifyOtp(body: VerifyOtpBody): Promise<VerifyOtpResponse> {
  const response = await apiClient.post<VerifyOtpResponse>('/auth/verify-otp', body);
  const payload = response.data;
  // Sau khi verify xong, nếu BE có trả về token thì lưu ngay
  // (Lưu ý: BE verify-otp hiện tại của bạn chưa trả token, chỉ trả verified: true)
  return payload;
}

// ─── QUÊN MẬT KHẨU ────────────────────────────────────────────────────────────

/**
 * Yêu cầu gửi OTP để reset mật khẩu.
 */
export async function requestPasswordReset(body: SendOtpBody): Promise<string> {
  const response = await apiClient.post<string>('/auth/request-password-reset', body);
  return response.data;
}

/**
 * Đổi mật khẩu mới kèm mã OTP.
 */
export async function changePassword(body: ChangePasswordBody): Promise<string> {
  const response = await apiClient.post<string>('/auth/change-password', body);
  return response.data;
}

// ─── POST /auth/login ─────────────────────────────────────────────────────────

/**
 * Đăng nhập cho cả Customer và Admin.
 * `identity` = phone hoặc email.
 * Tự động lưu access_token sau khi login thành công.
 */
export async function login(body: LoginBody): Promise<LoginPayload> {
  const response = await apiClient.post<LoginPayload>('/auth/login', body);
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
  Pick<ApiUser, 'full_name' | 'phone' | 'email' | 'address' | 'city' | 'district'>
>;

/**
 * Cập nhật thông tin cá nhân của user hiện tại.
 */
export async function updateMe(body: UpdateMeBody): Promise<ApiUser> {
  const response = await apiClient.patch<ApiUser>('/me', body);
  return response.data;
}
