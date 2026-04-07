'use client';

import { useTranslation } from 'react-i18next';
import { useState, useEffect, useMemo } from 'react';
import { type AuthUser } from '@/lib/auth';
import {
  readHistory,
  writeHistory,
  useSyncStore,
  STORAGE_KEYS,
  type HistoryItem,
} from '@/lib/store';
import { getToken } from '@/lib/apiClient';
import { useMyOrders } from '@/hooks/useOrders';
import { type Order } from '@/types/api';

// Re-export so App.tsx and other importers have zero breaking changes
export type { HistoryItem };

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
}

export default function HistoryModal({ isOpen, onClose, currentUser }: HistoryModalProps) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [hoverRating, setHoverRating] = useState<number>(0);

  // Task 1: đọc từ store (fallback khi chưa có token / API chưa chạy)
  const [historyItems, setHistoryItems] = useSyncStore<HistoryItem[]>(
    STORAGE_KEYS.history,
    readHistory(),
  );

  // Task 5: Nếu có token → ưu tiên lấy lịch sử từ API
  const hasToken = typeof window !== 'undefined' && !!getToken();
  const { data: apiOrderData } = useMyOrders(
    hasToken && isOpen ? {} : undefined,
  );

  // Map API Order → HistoryItem để hiển thị
  const apiHistoryItems = useMemo<HistoryItem[]>(() => {
    if (!apiOrderData?.items) return [];
    return apiOrderData.items.map((o: Order): HistoryItem => ({
      id: o.id,
      date: o.booking_date,
      status:
        o.status === 'completed' ? 'completed'
        : o.status === 'cancelled' || o.status === 'no_show' ? 'cancelled'
        : 'in_progress',
      customerName: o.customer.name,
      phone: o.customer.phone,
      email: o.customer.email,
      address: `${o.address.street}, ${o.address.district}, ${o.address.province}`,
      timeSlot: `${o.booking_date} • ${o.time_slot_label ?? o.time_slot_id}`,
      handlingMode: o.handling_mode,
      items: o.items.map((item) => ({
        name: item.custom_item_name ?? item.service_name,
        quantity: item.quantity,
        price: item.line_total,
      })),
      total: o.final_total ?? o.estimated_total,
    }));
  }, [apiOrderData]);

  // Chọn nguồn dữ liệu: API ưu tiên, localStorage là fallback
  const displayItems: HistoryItem[] = hasToken && apiHistoryItems.length > 0
    ? apiHistoryItems
    : historyItems;

  // Lazy-seed: nếu store trống, điền seed data
  useEffect(() => {
    if (historyItems.length === 0) {
      const seeded = readHistory();
      if (seeded.length > 0) setHistoryItems(seeded);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRateOrder = (orderId: string, rating: number) => {
    const updated = historyItems.map((item) =>
      item.id === orderId ? { ...item, rating } : item,
    );
    setHistoryItems(updated);
    writeHistory(updated);
  };

  const getStatusLabel = (status: HistoryItem['status']) => {
    switch (status) {
      case 'completed':
        return currentLang === 'vi' ? 'Đã hoàn thành' : currentLang === 'sv' ? 'Slutförd' : 'Completed';
      case 'in_progress':
        return currentLang === 'vi' ? 'Đang xử lý' : currentLang === 'sv' ? 'Pågår' : 'In Progress';
      case 'cancelled':
        return currentLang === 'vi' ? 'Đã hủy' : currentLang === 'sv' ? 'Avbruten' : 'Cancelled';
      default:
        return status;
    }
  };

  const getStatusColor = (status: HistoryItem['status']) => {
    switch (status) {
      case 'completed':  return 'bg-[#22C55E]/10 text-[#22C55E]';
      case 'in_progress': return 'bg-[#F59E0B]/10 text-[#F59E0B]';
      case 'cancelled':  return 'bg-red-500/10 text-red-500';
      default:           return 'bg-gray-100 text-gray-500';
    }
  };

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat(
      currentLang === 'vi' ? 'vi-VN' : currentLang === 'sv' ? 'sv-SE' : 'en-US',
      {
        style: 'currency',
        currency: currentLang === 'vi' ? 'VND' : currentLang === 'sv' ? 'SEK' : 'USD',
        maximumFractionDigits: 0,
      },
    ).format(amount);

  if (!isOpen || !currentUser) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#0B1511]/60 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl overflow-hidden rounded-[32px] bg-white shadow-[0_20px_80px_rgba(0,0,0,0.25)] animate-fadeInUp flex flex-col transform-gpu">
        {/* Header */}
        <div className="shrink-0 bg-[linear-gradient(135deg,#103B2D_0%,#18543F_55%,#1D6B4E_100%)] p-6 text-white text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{selectedOrderId ? '📄' : '📋'}</span>
              <div className="text-left">
                <h2 className="text-xl font-bold">
                  {selectedOrderId
                    ? currentLang === 'vi' ? 'Chi tiết đơn hàng' : 'Order Details'
                    : currentLang === 'vi' ? 'Lịch sử thu gom' : 'Booking History'}
                </h2>
                <p className="text-xs text-[#A7E8B6] uppercase tracking-widest">
                  {selectedOrderId
                    ? `#${selectedOrderId}`
                    : `${displayItems.length} ${currentLang === 'vi' ? 'yêu cầu đã thực hiện' : 'requests made'}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedOrderId && (
                <button
                  onClick={() => setSelectedOrderId(null)}
                  className="flex h-10 px-4 items-center justify-center rounded-full bg-white/10 text-xs font-bold transition-colors hover:bg-white/20"
                >
                  {currentLang === 'vi' ? 'Quay lại' : 'Back'}
                </button>
              )}
              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto p-4 sm:p-6 [scrollbar-gutter:stable] contain-content transform-gpu">
          {displayItems.length === 0 ? (
            <div className="py-20 text-center">
              <span className="text-5xl opacity-20 grayscale">📦</span>
              <p className="mt-4 text-sm font-medium text-[#24483A]/50">
                {currentLang === 'vi' ? 'Bạn chưa có yêu cầu thu gom nào.' : 'No booking history found.'}
              </p>
            </div>
          ) : selectedOrderId ? (
            // Detailed View
            <div className="animate-fadeIn space-y-6">
              {displayItems.filter((item) => item.id === selectedOrderId).map((item) => (
                <div key={item.id} className="space-y-6">
                  <div className="rounded-3xl bg-[#F7FCF8] p-6 border border-[#D6EEDD]">
                    <h3 className="mb-4 text-base font-bold text-[#103B2D]">
                      {currentLang === 'vi' ? 'Tóm tắt đơn hàng' : 'Order Summary'}
                    </h3>
                    <ul className="space-y-4">
                      <li className="flex items-center gap-4">
                        <span className="text-2xl w-6">👤</span>
                        <span className="text-base font-medium text-[#103B2D]/70">{item.customerName}</span>
                      </li>
                      <li className="flex items-center gap-4">
                        <span className="text-2xl w-6">📞</span>
                        <span className="text-base font-medium text-[#103B2D]/70">{item.phone}</span>
                      </li>
                      <li className="flex items-center gap-4">
                        <span className="text-2xl w-6">📧</span>
                        <span className="text-base font-medium text-[#103B2D]/70">{item.email}</span>
                      </li>
                      <li className="flex items-start gap-4">
                        <span className="text-2xl w-6 mt-0.5">📍</span>
                        <span className="text-base font-medium text-[#103B2D]/70 leading-relaxed">{item.address}</span>
                      </li>
                      <li className="flex items-center gap-4">
                        <span className="text-2xl w-6">🗓️</span>
                        <span className="text-base font-medium text-[#103B2D]/70">{item.timeSlot}</span>
                      </li>
                      <li className="flex items-center gap-4">
                        <span className="text-2xl w-6">🚚</span>
                        <span className="text-base font-medium text-[#103B2D]/70">{item.handlingMode}</span>
                      </li>
                      <li className="flex items-center gap-4 pt-2">
                        <span className="text-2xl w-6">💰</span>
                        <span className="text-xl font-bold text-[#22C55E]">{formatPrice(item.total)}</span>
                      </li>
                    </ul>
                  </div>

                  {/* Rating Section for Completed Orders */}
                  {item.status === 'completed' && (
                    <div className="rounded-3xl bg-white border-2 border-[#22C55E]/20 p-6 shadow-sm animate-fadeIn">
                      <div className="flex flex-col items-center text-center">
                        <h3 className="text-base font-bold text-[#103B2D] mb-2">
                          {currentLang === 'vi' ? 'Đánh giá dịch vụ' : 'Rate our service'}
                        </h3>
                        <p className="text-xs text-gray-400 mb-4">
                          {currentLang === 'vi' ? 'Sự hài lòng của bạn là động lực của chúng tôi' : 'Your feedback drives our improvement'}
                        </p>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => handleRateOrder(item.id, star)}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                              className="text-4xl transition-all hover:scale-125 active:scale-95"
                            >
                              <span className={(hoverRating || item.rating || 0) >= star ? 'text-yellow-400' : 'text-gray-100'}>
                                ★
                              </span>
                            </button>
                          ))}
                        </div>
                        {(hoverRating || item.rating || 0) > 0 && (
                          <p className="mt-3 text-sm font-bold text-[#22C55E] animate-fadeIn">
                            {(hoverRating || item.rating) === 5 ? '⭐⭐⭐⭐⭐ Tuyệt vời!' :
                             (hoverRating || item.rating) === 4 ? '⭐⭐⭐⭐ Rất tốt' :
                             (hoverRating || item.rating) === 3 ? '⭐⭐⭐ Hài lòng' : 'Cảm ơn bạn!'}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="rounded-3xl border border-[#D6EEDD] p-6">
                    <h3 className="mb-4 text-sm font-bold text-[#103B2D] uppercase tracking-widest">
                      {currentLang === 'vi' ? 'Danh sách vật phẩm' : 'Item List'}
                    </h3>
                    <div className="space-y-3">
                      {item.items.map((svc, idx) => (
                        <div key={idx} className="flex items-center justify-between py-2 border-b border-[#D6EEDD]/30 last:border-0">
                          <span className="text-sm font-semibold text-[#103B2D]">{svc.name} x{svc.quantity}</span>
                          <span className="text-sm font-bold text-[#103B2D]/40">{formatPrice(svc.price)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // List View
            <div className="space-y-4">
              {displayItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedOrderId(item.id)}
                  className="w-full text-left group rounded-3xl border border-[#D6EEDD] bg-[#F7FCF8] p-5 transition-all hover:border-[#22C55E] hover:bg-white hover:shadow-xl active:scale-[0.98]"
                >
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-[#24483A]/30 uppercase tracking-widest">#{item.id}</span>
                      <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${getStatusColor(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-[#24483A]/50">{item.date}</span>
                  </div>

                  <div className="space-y-2 border-b border-[#D6EEDD]/50 pb-4 mb-4">
                    {item.items.map((svc, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-[#103B2D]">{svc.name} x{svc.quantity}</span>
                        <span className="text-xs font-semibold text-[#103B2D]/40">{formatPrice(svc.price)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#24483A]/60">
                      <span className="text-sm">📍</span>
                      <span className="text-xs font-medium truncate max-w-[200px]">{item.address}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-[#24483A]/30 uppercase tracking-widest">
                        {currentLang === 'vi' ? 'Tổng chi phí' : 'Total cost'}
                      </p>
                      <p className="text-lg font-bold text-[#22C55E]">{formatPrice(item.total)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-[#D6EEDD]/30 p-6 bg-[#F7FCF8]/50">
          <p className="text-center text-[10px] font-bold text-[#24483A]/40 uppercase tracking-[0.2em]">
            Hệ thống quản lý rác thải thông minh EcoCollect
          </p>
        </div>
      </div>
    </div>
  );
}
