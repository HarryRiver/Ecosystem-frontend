export interface RetryConfig {
  retries?: number;        // Số lần thử lại tối đa (Mặc định: 3)
  initialDelayMs?: number; // Thời gian trễ ban đầu (Mặc định: 1000ms)
  maxDelayMs?: number;     // Thời gian trễ tối đa (Mặc định: 10000ms)
  factor?: number;         // Hệ số lũy tiến (Mặc định: 2)
}

/**
 * Hàm bọc hỗ trợ tự động thử lại với Exponential Backoff và Jitter
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {},
  attempt = 0
): Promise<T> {
  const {
    retries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    factor = 2
  } = config;

  try {
    return await fn();
  } catch (error: any) {
    // Chỉ thử lại nếu chưa vượt quá số lần cấu hình và lỗi là tạm thời (Network/5xx)
    if (attempt < retries && isTransientError(error)) {
      // 1. Tính toán Exponential Backoff: delay = initialDelay * (factor ^ attempt)
      const rawDelay = initialDelayMs * Math.pow(factor, attempt);
      const cappedDelay = Math.min(rawDelay, maxDelayMs);
      
      // 2. Thêm Full Jitter (Độ trễ ngẫu nhiên từ 0 đến cappedDelay)
      const delayWithJitter = Math.random() * cappedDelay;

      console.warn(
        `[API Retry] Thử lại lần ${attempt + 1}/${retries} sau ${Math.round(delayWithJitter)}ms do lỗi:`,
        error.message || error
      );

      await new Promise((resolve) => setTimeout(resolve, delayWithJitter));
      return withRetry(fn, config, attempt + 1);
    }

    throw error;
  }
}

/**
 * Kiểm tra lỗi có phải là lỗi tạm thời (Transient Error) để thử lại hay không
 */
function isTransientError(error: any): boolean {
  // Lỗi mạng hoặc không kết nối được server (statusCode = 0 hoặc không có statusCode trong ApiError)
  if (error && (error.statusCode === undefined || error.statusCode === 0)) return true;
  
  // Các mã lỗi Server tạm thời (502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout)
  const transientStatuses = [502, 503, 504];
  return transientStatuses.includes(error.statusCode);
}
