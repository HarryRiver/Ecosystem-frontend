'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  currency,
  CustomerRecord,
  Order,
  OrderStatus,
  readCustomers,
  readOrders,
  statusFilters,
  statusMeta,
  updateOrderStatus,
  writeCustomers,
  writeOrders,
} from '../../lib/store';
import { cn } from '../../utils/cn';
// ─── API Layer ────────────────────────────────────────────────────────────────────────────────
import {
  getAdminOrders,
  updateAdminOrder,
  markOrderNoShow,
  type UpdateAdminOrderBody,
} from '../../services/admin.service';
import {
  findCustomerForOrder,
  getPaginatedItems,
  mapApiOrderToCustomerRecord,
  mapApiOrderToStoreOrder,
  mapStoreOrderStatusToApiStatus,
  mergeCustomerRecords,
} from '../../lib/adminApiAdapters';

/* ─── Icons ──────────────────────────────────────────────────────── */
function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
function IconX({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
function IconFlag({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" />
    </svg>
  );
}
function IconChevron({ className, open }: { className?: string; open: boolean }) {
  return (
    <svg
      className={cn(className, 'transition-transform duration-300', open ? 'rotate-180' : '')}
      viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}
function IconPencil({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" />
    </svg>
  );
}
function IconUser({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
    </svg>
  );
}
function IconCalendar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" />
      <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" />
      <line x1="3" y1="10" x2="21" y2="10" strokeLinecap="round" />
    </svg>
  );
}

/* ─── Detail Panel ───────────────────────────────────────────────── */
function OrderDetailPanel({
  order,
  customer,
  adjustedAmount,
  onAdjustedAmountChange,
  onConfirm,
  onReject,
  onComplete,
  onNoShow,
}: {
  order: Order;
  customer?: CustomerRecord;
  adjustedAmount: number;
  onAdjustedAmountChange: (val: number) => void;
  onConfirm: () => void;
  onReject: () => void;
  onComplete: () => void;
  onNoShow: () => void;
}) {
  const [priceInput, setPriceInput] = useState(String(adjustedAmount));
  const [confirmingReject, setConfirmingReject] = useState(false);

  const handlePriceChange = (raw: string) => {
    setPriceInput(raw);
    const parsed = parseInt(raw.replace(/\D/g, ''), 10);
    if (!isNaN(parsed)) onAdjustedAmountChange(parsed);
  };

  const applyDelta = (delta: number) => {
    const next = Math.max(0, adjustedAmount + delta);
    onAdjustedAmountChange(next);
    setPriceInput(String(next));
  };

  return (
    <div className="mt-4 overflow-hidden rounded-[24px] border border-[#D7ECDD] bg-[#F9FCFA]">
      {/* Header */}
      <div className="border-b border-[#E5F0E8] bg-white px-5 py-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2F855A]">Chi tiết đơn hàng</p>
      </div>

      <div className="grid gap-4 p-5 md:grid-cols-2">
        {/* ── Thông tin khách ── */}
        <div className="rounded-[20px] border border-[#E5F0E8] bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <IconUser className="h-4 w-4 text-[#2F855A]" />
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#2F855A]">Khách hàng</p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#6D877A]">Họ tên</span>
              <span className="font-semibold text-[#103B2D]">{customer?.name ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6D877A]">SĐT</span>
              <span className="font-semibold text-[#103B2D]">{customer?.phone ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6D877A]">Email</span>
              <span className="truncate pl-4 text-right font-semibold text-[#103B2D]">{customer?.email ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6D877A]">Khu vực</span>
              <span className="font-semibold text-[#103B2D]">{customer?.district ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6D877A]">Loại TK</span>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-semibold',
                  customer?.accountType === 'member'
                    ? 'bg-[#E6FFEE] text-[#2F855A]'
                    : 'bg-amber-100 text-amber-700'
                )}
              >
                {customer?.accountType === 'member' ? 'Thành viên' : 'Khách vãng lai'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Thông tin đơn ── */}
        <div className="rounded-[20px] border border-[#E5F0E8] bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <IconCalendar className="h-4 w-4 text-[#2F855A]" />
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#2F855A]">Lịch hẹn & Dịch vụ</p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#6D877A]">Mã đơn</span>
              <span className="font-bold text-[#103B2D]">{order.code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6D877A]">Ngày hẹn</span>
              <span className="font-semibold text-[#103B2D]">{order.schedule.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6D877A]">Khung giờ</span>
              <span className="font-semibold text-[#103B2D]">{order.schedule.timeSlot}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6D877A]">Thanh toán</span>
              <span className="font-semibold text-[#103B2D]">
                {order.paymentMethod === 'online' ? 'Online' : 'Tiền mặt'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6D877A]">Nhân viên</span>
              <span className="font-semibold text-[#103B2D]">{order.assignedStaff}</span>
            </div>
          </div>
        </div>

        {/* ── Danh sách vật phẩm ── */}
        {order.items.length > 0 && (
          <div className="rounded-[20px] border border-[#E5F0E8] bg-white p-4 md:col-span-2">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#2F855A]">Danh sách vật phẩm</p>
            <div className="space-y-1">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-[#103B2D]">{item.name} x{item.quantity}</span>
                  <span className="font-semibold text-[#103B2D]">{item.price > 0 ? currency.format(item.price) : 'Báo giá'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tự đánh giá ── */}
        <div className="rounded-[20px] border border-[#E5F0E8] bg-white p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#2F855A]">Khách tự đánh giá đồ</p>
          <p className="text-sm leading-6 text-[#476458]">{order.selfAssessment}</p>
        </div>

        {/* ── Ghi chú giá ── */}
        <div className="rounded-[20px] border border-[#E5F0E8] bg-white p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#2F855A]">Ghi chú điều chỉnh giá</p>
          <p className="text-sm leading-6 text-[#476458]">{order.priceAdjustment}</p>
        </div>
      </div>

      {/* ── Điều chỉnh giá + Actions ── */}
      <div className="border-t border-[#E5F0E8] bg-white p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          {/* Price adjustment */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <IconPencil className="h-4 w-4 text-[#2F855A]" />
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#2F855A]">
                {order.status === 'delivering' ? 'Điều chỉnh giá trước khi hoàn thành' : 'Giá đơn hàng'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <p className="text-3xl font-bold text-[#103B2D]">{currency.format(adjustedAmount)}</p>

              {order.status === 'delivering' && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => applyDelta(-10000)}
                    className="rounded-full border border-[#D7ECDD] bg-white px-3 py-1.5 text-xs font-semibold text-[#476458] transition-colors hover:border-[#2F855A] hover:text-[#103B2D]"
                  >
                    −10k
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDelta(10000)}
                    className="rounded-full border border-[#D7ECDD] bg-white px-3 py-1.5 text-xs font-semibold text-[#476458] transition-colors hover:border-[#2F855A] hover:text-[#103B2D]"
                  >
                    +10k
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDelta(50000)}
                    className="rounded-full border border-[#D7ECDD] bg-white px-3 py-1.5 text-xs font-semibold text-[#476458] transition-colors hover:border-[#2F855A] hover:text-[#103B2D]"
                  >
                    +50k
                  </button>
                </div>
              )}
            </div>

            {order.status === 'delivering' && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-[#6D877A]">Nhập thủ công:</span>
                <input
                  type="text"
                  value={priceInput}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  className="w-36 rounded-full border border-[#CFE4D5] bg-[#F9FCFA] px-3 py-1.5 text-sm font-semibold text-[#103B2D] outline-none focus:border-[#2F855A]"
                  placeholder="VD: 380000"
                />
                <span className="text-xs text-[#6D877A]">đ</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {order.status === 'processing' && (
              <>
                {/* Từ chối đơn */}
                {confirmingReject ? (
                  <div className="flex items-center gap-2 rounded-[16px] border border-red-200 bg-red-50 px-4 py-2.5">
                    <span className="text-sm font-semibold text-red-700">Xác nhận từ chối?</span>
                    <button
                      type="button"
                      onClick={onReject}
                      className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white hover:bg-red-700"
                    >
                      Đồng ý
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingReject(false)}
                      className="rounded-full border border-red-200 px-3 py-1 text-xs font-bold text-red-600 hover:bg-red-100"
                    >
                      Hủy
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingReject(true)}
                    className="flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition-all hover:bg-red-100"
                  >
                    <IconX className="h-4 w-4" />
                    Từ chối đơn
                  </button>
                )}

                {/* Xác nhận đơn */}
                <button
                  type="button"
                  onClick={onConfirm}
                  className="flex items-center gap-2 rounded-full bg-[#103B2D] px-5 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                >
                  <IconCheck className="h-4 w-4" />
                  Xác nhận đơn
                </button>
              </>
            )}

            {order.status === 'delivering' && (
              <button
                type="button"
                onClick={onNoShow}
                className="flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 transition-all hover:bg-rose-100"
              >
                <IconX className="h-4 w-4" />
                Khách không có mặt
              </button>
            )}

            {order.status === 'delivering' && (
              <button
                type="button"
                onClick={onComplete}
                className="flex items-center gap-2 rounded-full bg-[#2F855A] px-5 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
              >
                <IconFlag className="h-4 w-4" />
                Hoàn thành đơn — {currency.format(adjustedAmount)}
              </button>
            )}

            {order.status === 'completed' && (
              <span className="flex items-center gap-2 rounded-full bg-teal-100 px-5 py-3 text-sm font-semibold text-teal-700">
                <IconCheck className="h-4 w-4" />
                Đã hoàn thành
              </span>
            )}

            {order.status === 'cancelled' && (
              <span className="flex items-center gap-2 rounded-full bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-600">
                <IconX className="h-4 w-4" />
                Đã từ chối
              </span>
            )}

            {order.status === 'no_show' && (
              <span className="flex items-center gap-2 rounded-full bg-rose-700 px-5 py-3 text-sm font-semibold text-white">
                <IconX className="h-4 w-4" />
                No-show đã ghi nhận
              </span>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Order Card ─────────────────────────────────────────────────── */
function OrderCard({
  order,
  customer,
  isExpanded,
  onToggle,
  onConfirm,
  onReject,
  onComplete,
  onNoShow,
  adjustedAmount,
  onAdjustedAmountChange,
}: {
  order: Order;
  customer?: CustomerRecord;
  isExpanded: boolean;
  onToggle: () => void;
  onConfirm: () => void;
  onReject: () => void;
  onComplete: () => void;
  onNoShow: () => void;
  adjustedAmount: number;
  onAdjustedAmountChange: (val: number) => void;
}) {
  const meta = statusMeta[order.status];

  const urgencyBorder =
    order.status === 'processing'
      ? 'border-amber-300'
      : order.status === 'delivering'
        ? 'border-sky-300'
        : 'border-[#D7ECDD]';

  return (
    <article
      className={cn(
        'overflow-hidden rounded-[28px] border bg-white shadow-[0_8px_24px_rgba(16,59,45,0.06)] transition-shadow hover:shadow-[0_16px_40px_rgba(16,59,45,0.10)]',
        urgencyBorder
      )}
    >
      {/* ── Card Header (always visible, clickable) ── */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-4 p-5 text-left"
      >
        {/* Status dot */}
        <span
          className={cn(
            'h-2.5 w-2.5 shrink-0 rounded-full',
            order.status === 'processing' ? 'bg-amber-400' :
            order.status === 'delivering' ? 'bg-sky-400' :
            order.status === 'completed'  ? 'bg-teal-500' :
            order.status === 'no_show'    ? 'bg-rose-500' :
                                            'bg-slate-400'
          )}
        />

        {/* Code + summary */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-[#103B2D]">{order.code}</span>
            <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', meta.tone)}>
              {meta.label}
            </span>
            {order.status === 'processing' && (
              <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                ⚡ Cần xử lý
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-[#476458]">
            {order.itemSummary} &nbsp;·&nbsp; {customer?.name} &nbsp;·&nbsp; {order.schedule.date} {order.schedule.timeSlot}
          </p>
        </div>

        {/* Amount */}
        <div className="hidden shrink-0 text-right sm:block">
          <p className="font-bold text-[#103B2D]">{currency.format(adjustedAmount)}</p>
          <p className="text-xs text-[#6D877A]">{order.paymentMethod === 'online' ? 'Online' : 'Tiền mặt'}</p>
        </div>

        {/* Chevron */}
        <IconChevron className="h-5 w-5 shrink-0 text-[#6D877A]" open={isExpanded} />
      </button>

      {/* ── Expandable Detail ── */}
      {isExpanded && (
        <div className="border-t border-[#EFF6F1] px-5 pb-5">
          <OrderDetailPanel
            order={order}
            customer={customer}
            adjustedAmount={adjustedAmount}
            onAdjustedAmountChange={onAdjustedAmountChange}
            onConfirm={onConfirm}
            onReject={onReject}
            onComplete={onComplete}
            onNoShow={onNoShow}
          />
        </div>
      )}
    </article>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export default function AdminOrdersPage() {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [orders, setOrders] = useState<Order[]>(() => readOrders());
  const [customers, setCustomers] = useState<CustomerRecord[]>(() => readCustomers());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adjustedAmounts, setAdjustedAmounts] = useState<Record<string, number>>(
    () => Object.fromEntries(readOrders().map((o) => [o.id, o.finalAmount]))
  );
  const [isLoading, setIsLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    getAdminOrders({ page: 1, limit: 200 })
      .then((response) => {
        if (cancelled) return;
        const apiOrders = getPaginatedItems(response);
        const nextOrders = apiOrders.map(mapApiOrderToStoreOrder);
        const nextCustomers = mergeCustomerRecords(
          readCustomers(),
          apiOrders.map(mapApiOrderToCustomerRecord),
        );

        setOrders(nextOrders);
        setCustomers(nextCustomers);
        setAdjustedAmounts(Object.fromEntries(nextOrders.map((o) => [o.id, o.finalAmount])));
        writeOrders(nextOrders);
        writeCustomers(nextCustomers);
        setSyncError(null);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error('[Admin] API failed:', error);
        setSyncError('Không tải được dữ liệu đơn hàng từ API. Đang giữ dữ liệu cục bộ nếu có.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Persist to store whenever orders change
  useEffect(() => {
    writeOrders(orders);
  }, [orders]);

  const handleStatusChange = (orderId: string, nextStatus: OrderStatus) => {
    const currentOrder = orders.find((order) => order.id === orderId);
    const newAmount = adjustedAmounts[orderId] ?? currentOrder?.finalAmount ?? 0;
    setOrders((prev) => updateOrderStatus(prev, orderId, nextStatus, newAmount));
    setExpandedId(null);
    setSyncError(null);

    // ─── Sync lên BE (fire-and-forget) ───
    const onSyncSuccess = (apiOrder: Awaited<ReturnType<typeof updateAdminOrder>>) => {
      const nextOrder = mapApiOrderToStoreOrder(apiOrder);
      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? nextOrder : order)),
      );
      setAdjustedAmounts((prev) => ({ ...prev, [orderId]: nextOrder.finalAmount }));
    };

    if (nextStatus === 'no_show') {
      markOrderNoShow(orderId).then(onSyncSuccess).catch((error: unknown) => {
        console.error('[Admin] API failed:', error);
        setSyncError('Cập nhật API thất bại. UI đã giữ thay đổi local.');
      });
    } else {
      const body: UpdateAdminOrderBody = {
        status: mapStoreOrderStatusToApiStatus(nextStatus),
      };

      if (nextStatus === 'completed') {
        body.final_total = newAmount;
        if (currentOrder && currentOrder.finalAmount !== newAmount) {
          body.adjustment_reason = 'Admin price adjustment';
        }
      }

      updateAdminOrder(orderId, body).then(onSyncSuccess).catch((error: unknown) => {
        console.error('[Admin] API failed:', error);
        setSyncError('Cập nhật API thất bại. UI đã giữ thay đổi local.');
      });
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const customer = findCustomerForOrder(order, customers);
      const matchesQuery =
        normalizedQuery === '' ||
        order.code.toLowerCase().includes(normalizedQuery) ||
        order.itemSummary.toLowerCase().includes(normalizedQuery) ||
        (customer?.name.toLowerCase().includes(normalizedQuery) ?? false) ||
        (customer?.phone.includes(normalizedQuery) ?? false);
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [customers, normalizedQuery, orders, statusFilter]);

  const statusSummary = (Object.entries(statusMeta) as [OrderStatus, { label: string; tone: string }][]).map(
    ([status, meta]) => ({
      id: status,
      label: meta.label,
      count: orders.filter((o) => o.status === status).length,
      tone: meta.tone,
    })
  );

  const pendingCount = orders.filter((o) => o.status === 'processing').length;

  return (
    <div className="space-y-8">
      {/* ── Hero banner ── */}
      <section className="hidden md:block rounded-[32px] bg-[linear-gradient(135deg,_#103B2D_0%,_#18543F_100%)] p-6 text-white shadow-[0_28px_80px_rgba(16,59,45,0.18)]">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#A7E8B6]">
          Trang kiểm tra đơn hàng
        </p>
        <h1 className="mt-3 text-4xl font-bold">Xác nhận, từ chối và hoàn thành đơn</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/78">
          Đơn mới → admin <strong className="text-white">Xác nhận</strong> hoặc{' '}
          <strong className="text-white">Từ chối</strong>. Đơn đang giao → điều chỉnh giá rồi{' '}
          <strong className="text-white">Hoàn thành</strong>.
        </p>
        {pendingCount > 0 && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-400/20 px-4 py-2 text-sm font-semibold text-amber-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
            {pendingCount} đơn đang chờ xác nhận
          </div>
        )}
      </section>

      {/* ── Status summary cards ── */}
      {(isLoading || syncError) && (
        <div className="rounded-[20px] border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-800">
          {isLoading ? 'Đang tải dữ liệu đơn hàng từ API...' : syncError}
        </div>
      )}


      <div className="hidden md:grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {statusSummary.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setStatusFilter(statusFilter === item.id ? 'all' : item.id)}
            className={cn(
              'rounded-[28px] border p-5 text-left shadow-[0_8px_24px_rgba(16,59,45,0.06)] transition-all',
              statusFilter === item.id
                ? 'border-[#2F855A] bg-[#F3FBF5] shadow-[0_12px_32px_rgba(47,133,90,0.12)]'
                : 'border-[#D7ECDD] bg-white hover:border-[#2F855A]'
            )}
          >
            <span className={cn('inline-flex rounded-full px-3 py-1 text-xs font-semibold', item.tone)}>
              {item.label}
            </span>
            <div className="mt-4 text-3xl font-bold text-[#103B2D]">{item.count}</div>
            <p className="mt-1 text-xs text-[#5D776A]">đơn</p>
          </button>
        ))}
      </div>

      {/* ── Filters + Search ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm theo mã đơn, tên khách, SĐT hoặc loại đồ..."
          className="h-12 flex-1 rounded-full border border-[#CFE4D5] bg-white px-5 text-sm outline-none transition-colors placeholder:text-[#6D877A] focus:border-[#2F855A] focus:shadow-[0_0_0_3px_rgba(47,133,90,0.1)]"
        />
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setStatusFilter(filter.id)}
              className={cn(
                'rounded-full px-4 py-2.5 text-sm font-semibold transition-colors',
                statusFilter === filter.id
                  ? 'bg-[#103B2D] text-white'
                  : 'bg-white text-[#476458] ring-1 ring-[#D7ECDD] hover:bg-[#F3FBF5]'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Order list ── */}
      <div className="space-y-4">
        {!isLoading && filteredOrders.length === 0 && (
          <div className="rounded-[28px] border border-[#D7ECDD] bg-white py-16 text-center text-[#6D877A]">
            {orders.length === 0 ? 'Chưa có dữ liệu' : 'Không tìm thấy đơn nào phù hợp'}
          </div>
        )}

        {filteredOrders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            customer={findCustomerForOrder(order, customers)}
            isExpanded={expandedId === order.id}
            onToggle={() => setExpandedId(expandedId === order.id ? null : order.id)}
            adjustedAmount={adjustedAmounts[order.id] ?? order.finalAmount}
            onAdjustedAmountChange={(val) =>
              setAdjustedAmounts((prev) => ({ ...prev, [order.id]: val }))
            }
            onConfirm={() => handleStatusChange(order.id, 'delivering')}
            onReject={() => handleStatusChange(order.id, 'cancelled')}
            onComplete={() => handleStatusChange(order.id, 'completed')}
            onNoShow={() => handleStatusChange(order.id, 'no_show')}
          />
        ))}
      </div>
    </div>
  );
}
