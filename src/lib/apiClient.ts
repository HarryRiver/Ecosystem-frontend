/**
 * src/lib/apiClient.ts
 * ─────────────────────────────────────────────────────────────
 * Axios instance dùng chung cho toàn bộ dự án.
 *
 * TRÁCH NHIỆM:
 *  1. Gắn Base URL từ env vào mọi request.
 *  2. Tự động gắn Authorization header nếu có token.
 *  3. Unwrap ApiResponse<T> wrapper — caller nhận thẳng data.
 *  4. Chuyển lỗi HTTP thành ApiError để xử lý thống nhất ở tầng trên.
 *  5. Tự động logout nếu nhận 401 (token hết hạn / không hợp lệ).
 * ─────────────────────────────────────────────────────────────
 */

import axios, {
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { type ApiResponse } from '@/types/api';

// ─── Hằng số ─────────────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000';
const TOKEN_STORAGE_KEY = 'ecocollect.auth.token';

// ─── Error class chuẩn ───────────────────────────────────────────────────────

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string | null;

  constructor(message: string, statusCode: number, errorCode: string | null = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

// ─── Token helpers ────────────────────────────────────────────────────────────

export function saveToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

// ─── Axios instance ───────────────────────────────────────────────────────────

const apiClient = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15_000, // 15 giây
});

// ─── Request Interceptor — gắn Bearer token ───────────────────────────────────

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error),
);

// ─── Response Interceptor — unwrap data hoặc throw ApiError ──────────────────

apiClient.interceptors.response.use(
  // Thành công: unwrap ApiResponse<T>.data
  (response: AxiosResponse<ApiResponse<unknown>>) => {
    const body = response.data;
    if (body && body.success === false) {
      // BE trả 200 nhưng success=false
      throw new ApiError(
        body.message ?? 'Có lỗi xảy ra',
        response.status,
        body.error_code,
      );
    }
    // Thay thế response.data bằng phần data thực
    response.data = body.data as ApiResponse<unknown>;
    return response;
  },

  // Thất bại: chuyển AxiosError thành ApiError
  (error: AxiosError<ApiResponse<null>>) => {
    if (error.response) {
      const status = error.response.status;
      const body = error.response.data;
      const message = body?.message ?? error.message ?? 'Có lỗi không xác định';
      const errorCode = body?.error_code ?? null;

      // 401 → xóa token (session hết hạn)
      if (status === 401) {
        removeToken();
        // Reload để AppShell kiểm tra lại session, tránh circular import
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ecocollect:unauthorized'));
        }
      }

      throw new ApiError(message, status, errorCode);
    }

    // Network error hoặc timeout
    throw new ApiError(
      'Không thể kết nối đến máy chủ. Vui lòng kiểm tra Internet.',
      0,
    );
  },
);

export default apiClient;
