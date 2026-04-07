/**
 * src/hooks/useDebounce.ts
 * ─────────────────────────────────────────────────────────────
 * Generic debounce hook.
 * Dùng chủ yếu tại BookingModal để delay gọi POST /pricing/quote.
 * ─────────────────────────────────────────────────────────────
 */

'use client';

import { useState, useEffect } from 'react';

/**
 * Trả về giá trị đã debounce sau `delay` milliseconds.
 * @param value Giá trị cần debounce.
 * @param delay Thời gian chờ (ms). Mặc định 500ms.
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
