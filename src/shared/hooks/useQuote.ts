/**
 * src/hooks/useQuote.ts
 * ─────────────────────────────────────────────────────────────
 * Hook tự động gọi POST /pricing/quote khi giỏ hàng thay đổi.
 *
 * NGHIỆP VỤ (theo API_Specs.md mục V.3):
 *  - FE TUYỆT ĐỐI KHÔNG tự tính giá.
 *  - Mỗi khi items / handling_mode / stairs_floors / voucher thay đổi,
 *    hook debounce 500ms rồi gọi BE lấy giá chính thức.
 * ─────────────────────────────────────────────────────────────
 */

'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { getQuote } from '@/features/booking-flow/services/orders.service';
import { type QuoteBody, type QuoteResult } from '@/shared/types/api';

interface UseQuoteReturn {
  quote: QuoteResult | null;
  isLoading: boolean;
  error: string | null;
}

const EMPTY_QUOTE: QuoteResult = {
  service_subtotal: 0,
  handling_fee: 0,
  discount_amount: 0,
  estimated_total: 0,
  manual_quote_required: false,
};

/**
 * @param body Payload giỏ hàng. Truyền `null` để tắt auto-quote.
 */
export function useQuote(body: QuoteBody | null): UseQuoteReturn {
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce toàn bộ body để tránh spam API
  const debouncedBody = useDebounce(body, 500);

  useEffect(() => {
    // Nếu không có items hoặc items rỗng → reset về 0
    if (!debouncedBody || debouncedBody.items.length === 0) {
      setQuote(EMPTY_QUOTE);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getQuote(debouncedBody)
      .then((result) => {
        if (!cancelled) {
          setQuote(result);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : 'Không thể báo giá. Thử lại.';
          setError(message);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    // Cleanup: nếu body thay đổi trước khi request hoàn tất, bỏ kết quả cũ
    return () => {
      cancelled = true;
    };
  }, [debouncedBody]);

  return { quote, isLoading, error };
}
