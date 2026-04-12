'use client';

import { useDeferredValue, useEffect, useState, useMemo } from 'react';
import { cn } from '../utils/cn';
import { type AuthUser } from '../lib/auth';
import {
  currency,
  getCustomerFacingStatus,
  OrderStatus,
  statusMeta,
  statusFilters,
  type CustomerRecord,
  type OrderRecord,
  readOrders,
  readPricing,
  writePricing,
  readCustomers,
} from '../data/adminDashboardMock';
import {
  readHistory,
  writeHistory,
  useSyncStore,
  STORAGE_KEYS,
  type ServicePriceRecord,
  type HistoryItem,
} from '../lib/store';
// ─── API Layer ────────────────────────────────────────────────────────────────────────────────
import {
  getAdminMetrics,
  getAdminOrders,
  getAdminServices,
  getAdminUsers,
  updateAdminOrder,
  updateAdminService,
  markOrderNoShow,
} from '../services/admin.service';
import {
  findCustomerForOrder,
  getMetricValue,
  mapApiOrderToCustomerRecord,
  mapApiOrderToStoreOrder,
  mapApiServiceToServicePriceRecord,
  mapApiUserToCustomerRecord,
  mapStoreOrderStatusToApiStatus,
  mergeCustomerRecords,
} from '../lib/adminApiAdapters';
import type { AdminMetrics } from '../types/api';

/* ─── Types ─────────────────────────────────────────────────────────── */
type Tab = 'overview' | 'users' | 'pricing' | 'orders';

interface AdminDashboardProps {
  currentUser?: AuthUser | null;
  onLogout?: () => void;
}

/* ─── SVG Icons ─────────────────────────────────────────────────────── */
function IconDashboard({ active }: { active?: boolean }) {
  return (
    <svg className={cn('h-5 w-5 transition-colors', active ? 'text-[#2F855A]' : 'text-[#6D877A]')} fill="none" strokeWidth={1.8} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}
function IconUsers({ active }: { active?: boolean }) {
  return (
    <svg className={cn('h-5 w-5 transition-colors', active ? 'text-[#2F855A]' : 'text-[#6D877A]')} fill="none" strokeWidth={1.8} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 0 0-4-4h-1M9 20H4v-2a4 4 0 0 1 4-4h2m3-4a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-6 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    </svg>
  );
}
function IconPricing({ active }: { active?: boolean }) {
  return (
    <svg className={cn('h-5 w-5 transition-colors', active ? 'text-[#2F855A]' : 'text-[#6D877A]')} fill="none" strokeWidth={1.8} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}
function IconOrders({ active }: { active?: boolean }) {
  return (
    <svg className={cn('h-5 w-5 transition-colors', active ? 'text-[#2F855A]' : 'text-[#6D877A]')} fill="none" strokeWidth={1.8} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v0ZM9 12h6M9 16h4" />
    </svg>
  );
}
function IconLogout() {
  return (
    <svg className="h-4 w-4" fill="none" strokeWidth={1.8} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

/* ─── Nav Config ─────────────────────────────────────────────────────── */
const NAV_ITEMS: { id: Tab; label: string; desc: string; badge?: number }[] = [
  { id: 'overview', label: 'Tổng quan', desc: 'Số liệu & tóm tắt' },
  { id: 'users',    label: 'Khách hàng', desc: 'Quản lý tài khoản' },
  { id: 'pricing',  label: 'Bảng giá', desc: 'Cập nhật giá dịch vụ' },
  { id: 'orders',   label: 'Đơn hàng', desc: 'Xác nhận & chốt đơn' },
];

function NavIcon({ id, active }: { id: Tab; active?: boolean }) {
  if (id === 'overview') return <IconDashboard active={active} />;
  if (id === 'users')    return <IconUsers active={active} />;
  if (id === 'pricing')  return <IconPricing active={active} />;
  return <IconOrders active={active} />;
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════════ */
export default function AdminDashboard({ currentUser, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();

  // Đọc từ store thật — tự đồng bộ multi-tab qua BroadcastChannel
  const [orders, setOrders] = useSyncStore<OrderRecord[]>(STORAGE_KEYS.orders, readOrders());
  const [servicePricing, setServicePricing] = useSyncStore<ServicePriceRecord[]>(STORAGE_KEYS.pricing, readPricing());
  const [customers, setCustomers] = useSyncStore<CustomerRecord[]>(STORAGE_KEYS.customers, readCustomers());
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [isAdminApiLoading, setIsAdminApiLoading] = useState(false);
  const [adminApiNotice, setAdminApiNotice] = useState<string | null>(null);

  const [selectedPricingCategory, setSelectedPricingCategory] = useState<string>('Tất cả');

  useEffect(() => {
    let cancelled = false;

    async function loadAdminApiData() {
      setIsAdminApiLoading(true);

      const [metricsResult, ordersResult, usersResult, servicesResult] =
        await Promise.allSettled([
          getAdminMetrics(),
          getAdminOrders({ page: 1, limit: 200 }),
          getAdminUsers({ role: 'customer', page: 1, limit: 200 }),
          getAdminServices({ page: 1, limit: 200 }),
        ]);

      if (cancelled) return;

      let hasFailure = false;
      let nextCustomers = readCustomers();

      if (metricsResult.status === 'fulfilled') {
        setMetrics(metricsResult.value);
      } else {
        hasFailure = true;
        console.error('[Admin] API failed:', metricsResult.reason);
      }

      if (ordersResult.status === 'fulfilled') {
        const nextOrders = ordersResult.value.items.map(mapApiOrderToStoreOrder);
        setOrders(nextOrders);
        nextCustomers = mergeCustomerRecords(
          nextCustomers,
          ordersResult.value.items.map(mapApiOrderToCustomerRecord),
        );
      } else {
        hasFailure = true;
        console.error('[Admin] API failed:', ordersResult.reason);
      }

      if (usersResult.status === 'fulfilled') {
        nextCustomers = mergeCustomerRecords(
          nextCustomers,
          usersResult.value.items.map(mapApiUserToCustomerRecord),
        );
      } else {
        hasFailure = true;
        console.error('[Admin] API failed:', usersResult.reason);
      }

      if (servicesResult.status === 'fulfilled') {
        setServicePricing(servicesResult.value.items.map(mapApiServiceToServicePriceRecord));
      } else {
        hasFailure = true;
        console.error('[Admin] API failed:', servicesResult.reason);
      }

      setCustomers(nextCustomers);
      setAdminApiNotice(
        hasFailure ? 'Chưa có dữ liệu' : null,
      );
      setIsAdminApiLoading(false);
    }

    void loadAdminApiData();

    return () => {
      cancelled = true;
    };
  }, []);

  const groupedPricing = useMemo(() => {
    const groups: Record<string, ServicePriceRecord[]> = {};
    servicePricing.forEach((s) => {
      if (!groups[s.category]) groups[s.category] = [];
      groups[s.category].push(s);
    });
    return groups;
  }, [servicePricing]);

  const categoriesList = useMemo(() => {
    return ['Tất cả', ...Object.keys(groupedPricing)];
  }, [groupedPricing]);

  const filteredPricing = useMemo(() => {
    if (selectedPricingCategory === 'Tất cả') return servicePricing;
    return servicePricing.filter(s => s.category === selectedPricingCategory);
  }, [servicePricing, selectedPricingCategory]);

  /**
   * Cập nhật trạng thái đơn: optimistic update cục bộ ngay lập tức,
   * sau đó gọi API BE để đồng bộ.
   */
  const updateOrderStatusSync = (orderId: string, nextStatus: OrderStatus) => {
    // 1) Optimistic: cập nhật store cục bộ ngay
    setOrders((cur: OrderRecord[]) => {
      const next = cur.map((o: OrderRecord) => o.id === orderId ? {
        ...o, status: nextStatus, updatedAt: new Date().toISOString()
      } : o);
      return next;
    });

    // Cập nhật history cục bộ
    const historyStatusMap: Record<OrderStatus, 'in_progress' | 'completed' | 'cancelled'> = {
      processing: 'in_progress',
      delivering: 'in_progress',
      completed:  'completed',
      cancelled:  'cancelled',
      no_show:    'cancelled',
    };
    const historyItems: HistoryItem[] = readHistory();
    const updatedHistory: HistoryItem[] = historyItems.map((h: HistoryItem) =>
      h.id === orderId
        ? { ...h, status: historyStatusMap[nextStatus] }
        : h
    );
    writeHistory(updatedHistory);

    // 2) Gọi API thật (fire-and-forget: lỗi chỉ log, không cần rollback)
    const onSyncSuccess = (apiOrder: Awaited<ReturnType<typeof updateAdminOrder>>) => {
      const nextOrder = mapApiOrderToStoreOrder(apiOrder);
      setOrders((cur: OrderRecord[]) =>
        cur.map((order: OrderRecord) => (order.id === orderId ? nextOrder : order)),
      );
    };

    if (nextStatus === 'no_show') {
      markOrderNoShow(orderId).then(onSyncSuccess).catch((error: unknown) => {
        console.error('[Admin] API failed:', error);
        setAdminApiNotice('Cập nhật API thất bại. UI đã giữ thay đổi local.');
      });
    } else {
      updateAdminOrder(orderId, { status: mapStoreOrderStatusToApiStatus(nextStatus) })
        .then(onSyncSuccess)
        .catch((error: unknown) => {
          console.error('[Admin] API failed:', error);
          setAdminApiNotice('Cập nhật API thất bại. UI đã giữ thay đổi local.');
        });
    }
  };

  const adjustServicePrice = (serviceId: string, delta: number) => {
    const service = servicePricing.find((item) => item.id === serviceId);
    const nextPrice = Math.max(0, (service?.price ?? 0) + delta);

    setServicePricing((cur: ServicePriceRecord[]) => {
      const next = cur.map((s: ServicePriceRecord) => s.id === serviceId
        ? { ...s, price: nextPrice } : s);
      writePricing(next);
      return next;
    });
    updateAdminService(serviceId, { base_price: nextPrice })
      .then(() => setAdminApiNotice(null))
      .catch((error: unknown) => {
        console.error('[Admin] API failed:', error);
        setAdminApiNotice('Cập nhật giá API thất bại. UI đã giữ thay đổi local.');
      });
  };

  const getAdminAction = (order: OrderRecord) => {
    if (order.status === 'processing') return { label: 'Xác nhận đơn', helper: 'Chuyển sang đang giao hàng.', onClick: () => updateOrderStatusSync(order.id, 'delivering'), tone: 'bg-[#103B2D] text-white' };
    if (order.status === 'delivering') return { label: 'Hoàn thành đơn', helper: 'Chốt đơn sau khi giao / thu gom xong.', onClick: () => updateOrderStatusSync(order.id, 'completed'), tone: 'bg-[#2F855A] text-white' };
    if (order.status === 'no_show')   return null;
    return null;
  };

  const customerRows = customers
    .map((c) => {
      const cOrders = orders.filter((o) => findCustomerForOrder(o, [c]));
      const latest  = [...cOrders].sort((a, b) => b.schedule.date.localeCompare(a.schedule.date))[0];
      return { ...c, latestOrder: latest, ordersCount: cOrders.length, totalSpent: cOrders.reduce((s, o) => s + o.finalAmount, 0) };
    })
    .filter((c) => {
      const q = normalizedQuery === '' || c.name.toLowerCase().includes(normalizedQuery) || c.email.toLowerCase().includes(normalizedQuery) || c.phone.includes(normalizedQuery);
      const s = statusFilter === 'all' || c.latestOrder?.status === statusFilter;
      return q && s;
    });

  const statusSummary = Object.entries(statusMeta).map(([id, meta]) => ({
    id: id as OrderStatus, ...meta,
    count: orders.filter((o) => o.status === id).length,
  }));

  const localRevenue = orders.reduce((s, o) => s + o.finalAmount, 0);
  const totalRevenue  = getMetricValue(metrics, 'total_revenue', localRevenue);
  const totalOrders = getMetricValue(metrics, 'total_orders', orders.length);
  const memberCount   = customers.filter((c) => c.accountType === 'member').length;
  const pendingCount  = orders.filter((o) => ['processing', 'delivering'].includes(o.status)).length;

  /* ─────────────────────────────────────────────────────────────────── */
  return (
    <div className="flex min-h-screen bg-[#F4FAF5] text-[#103B2D]">

      {/* ══ SIDEBAR ══════════════════════════════════════════════════════ */}
      <aside className="hidden w-64 shrink-0 flex-col gap-3 border-r border-[#DFF0E5] bg-white p-4 shadow-[4px_0_30px_rgba(16,59,45,0.06)] lg:sticky lg:top-0 lg:flex lg:h-screen">

        {/* Brand */}
        <div className="mb-1 flex items-center gap-3 rounded-[20px] bg-[linear-gradient(135deg,#0d2f23,#103B2D)] px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2F855A] shadow-[0_4px_12px_rgba(47,133,90,0.5)]">
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5Z" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A7E8B6]">EcoCollect</p>
            <p className="text-xs font-semibold text-white">Admin</p>
          </div>
        </div>

        {/* Admin info */}
        <div className="flex items-center gap-3 rounded-[20px] border border-[#E0F0E6] bg-[#F7FCF8] px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2F855A]/20 text-sm font-bold text-[#2F855A] ring-2 ring-[#2F855A]/30">
            {(currentUser?.name ?? 'A').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#103B2D]">{currentUser?.name ?? 'Admin'}</p>
            <p className="truncate text-xs text-[#6D877A]">{currentUser?.email ?? 'admin@ecocollect.vn'}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8AA89A]">Menu</p>
          <div className="space-y-0.5">
            {NAV_ITEMS.map(({ id, label, desc, badge }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    'group relative flex w-full items-center gap-3 rounded-[16px] px-3 py-2.5 text-left transition-all duration-200',
                    isActive ? 'bg-[#EBF7F0] shadow-sm' : 'hover:bg-[#F5FAF6]',
                  )}
                >
                  {/* Active bar */}
                  <span className={cn('absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#2F855A] transition-all', isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-30')} />

                  <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all', isActive ? 'bg-white shadow-sm' : 'bg-transparent group-hover:bg-white/70')}>
                    <NavIcon id={id} active={isActive} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className={cn('text-sm font-semibold leading-tight', isActive ? 'text-[#103B2D]' : 'text-[#476458] group-hover:text-[#103B2D]')}>{label}</p>
                    <p className="mt-0.5 text-[11px] text-[#8AA89A] truncate">{desc}</p>
                  </div>

                  {badge !== undefined && (
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', isActive ? 'bg-[#103B2D] text-white' : 'bg-[#E0F5E6] text-[#2F855A]')}>
                      {badge}
                    </span>
                  )}
                  {id === 'orders' && pendingCount > 0 && (
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', isActive ? 'bg-white text-[#103B2D]' : 'bg-amber-100 text-amber-700')}>
                      {pendingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Logout */}
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-3 rounded-[16px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition-all hover:bg-red-100 hover:shadow-sm"
        >
          <IconLogout />
          Đăng xuất
        </button>
      </aside>

      {/* ══ MAIN CONTENT ════════════════════════════════════════════════ */}
      <main className="flex-1 overflow-y-auto">

        {/* Top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[#DFF0E5] bg-white/90 px-4 py-3 backdrop-blur-sm lg:px-8 lg:py-4">
          <div className="min-w-0 flex-1 pr-4">
            <h1 className="truncate text-xl font-bold text-[#103B2D] lg:text-2xl">
              {activeTab === 'overview' && 'Tổng quan'}
              {activeTab === 'users'    && 'Quản lý khách hàng'}
              {activeTab === 'pricing'  && 'Bảng giá dịch vụ'}
              {activeTab === 'orders'   && 'Quản lý đơn hàng'}
            </h1>
            <p className="mt-0.5 truncate text-xs text-[#6D877A] lg:text-sm">
              {activeTab === 'overview' && 'Số liệu & tình trạng hoạt động'}
              {activeTab === 'users'    && `${customerRows.length} khách hàng`}
              {activeTab === 'pricing'  && 'Điều chỉnh giá trực tiếp'}
              {activeTab === 'orders'   && `${pendingCount} đơn cần xử lý`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full bg-[#EBF7F0] px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#2F855A] sm:inline-block">
              Live
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 transition-colors hover:bg-red-100 lg:hidden"
            >
              <IconLogout />
            </button>
          </div>
        </header>

        <div className="p-4 pb-24 lg:p-8">
          {(isAdminApiLoading || adminApiNotice) && (
            <div className="mb-5 rounded-[20px] border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-800">
              {isAdminApiLoading ? 'Đang tải dữ liệu admin từ API...' : adminApiNotice}
            </div>
          )}

          {/* ══ TAB: OVERVIEW ═══════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Stat cards */}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: 'Tổng khách hàng', value: customers.length, sub: `${memberCount} thành viên`, icon: '👥', tone: 'from-emerald-400 to-teal-500' },
                  { label: 'Tổng đơn hàng', value: totalOrders, sub: `${orders.filter(o => o.status === 'completed').length} đã hoàn thành`, icon: '📦', tone: 'from-violet-400 to-purple-500' },
                  { label: 'Chờ xử lý', value: pendingCount, sub: 'Cần xác nhận hoặc chốt', icon: '⏳', tone: 'from-amber-400 to-orange-500' },
                  { label: 'Doanh thu', value: currency.format(totalRevenue), sub: `${orders.filter(o => o.status === 'no_show').length} no-show`, icon: '💰', tone: 'from-sky-400 to-blue-500' },
                ].map((card) => (
                  <div key={card.label} className="relative overflow-hidden rounded-[24px] bg-white p-5 shadow-[0_8px_30px_rgba(16,59,45,0.07)] border border-[#E8F5EC]">
                    <div className={cn('absolute -right-4 -top-4 h-20 w-20 rounded-full bg-linear-to-br opacity-10', card.tone)} />
                    <div className="flex items-start justify-between">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8AA89A]">{card.label}</p>
                      <span className="text-2xl">{card.icon}</span>
                    </div>
                    <div className="mt-3 text-3xl font-bold text-[#103B2D]">{card.value}</div>
                    <p className="mt-1 text-xs text-[#6D877A]">{card.sub}</p>
                  </div>
                ))}
              </div>

              {/* Status pill summary */}
              <div className="rounded-[24px] border border-[#DFF0E5] bg-white p-5 shadow-[0_8px_30px_rgba(16,59,45,0.05)]">
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-[#8AA89A]">Phân bổ trạng thái đơn</p>
                <div className="flex flex-wrap gap-3">
                  {statusSummary.map((s) => (
                    <div key={s.id} className="flex items-center gap-2 rounded-full border border-[#DFF0E5] bg-[#F7FCF8] px-4 py-2">
                      <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold', s.tone)}>{s.label}</span>
                      <span className="text-lg font-bold text-[#103B2D]">{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent orders */}
              <div className="rounded-[24px] border border-[#DFF0E5] bg-white p-5 shadow-[0_8px_30px_rgba(16,59,45,0.05)]">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8AA89A]">Đơn hàng gần nhất</p>
                  <button type="button" onClick={() => setActiveTab('orders')} className="text-xs font-semibold text-[#2F855A] hover:underline">
                    Xem tất cả →
                  </button>
                </div>
                <div className="space-y-2">
                  {orders.slice(0, 5).map((o) => (
                    <div key={o.id} className="flex items-center gap-4 rounded-[18px] bg-[#F7FCF8] px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#103B2D]">{o.code}</p>
                        <p className="text-xs text-[#6D877A] truncate">{o.itemSummary}</p>
                      </div>
                      <span className={cn('rounded-full px-3 py-1 text-[11px] font-semibold', statusMeta[o.status].tone)}>
                        {statusMeta[o.status].label}
                      </span>
                      <span className="text-sm font-bold text-[#103B2D] whitespace-nowrap">
                        {o.finalAmount > 0 ? currency.format(o.finalAmount) : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══ TAB: USERS ══════════════════════════════════════════════ */}
          {activeTab === 'users' && (
            <div className="animate-fadeIn space-y-4">
              {/* Search + filter bar */}
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm theo tên, email, số điện thoại..."
                  className="w-full sm:flex-1 sm:min-w-[260px] rounded-full border border-[#DFF0E5] bg-white px-4 py-2.5 text-sm outline-none shadow-sm transition-colors focus:border-[#2F855A]"
                />
                <div className="flex flex-wrap gap-2 justify-start">
                  {statusFilters.map((f) => (
                    <button key={f.id} type="button" onClick={() => setStatusFilter(f.id)}
                      className={cn('rounded-full px-4 py-2 text-sm font-semibold transition-colors', statusFilter === f.id ? 'bg-[#103B2D] text-white shadow-sm' : 'bg-white border border-[#DFF0E5] text-[#476458] hover:bg-[#F7FCF8]')}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-[#DFF0E5] bg-white shadow-[0_8px_30px_rgba(16,59,45,0.05)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-[#EEF8F1]">
                        {['Khách hàng', 'Loại TK', 'Đơn gần nhất', 'Trạng thái admin', 'Khách thấy', 'Đơn', 'Chi tiêu'].map((h) => (
                          <th key={h} className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-[#8AA89A]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {customerRows.map((c, i) => (
                        <tr key={c.id} className={cn('border-b border-[#F0F7F2] transition-colors hover:bg-[#F7FCF8]', i % 2 === 1 && 'bg-[#FAFCFB]')}>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EBF7F0] text-sm font-bold text-[#2F855A]">
                                {c.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-semibold text-[#103B2D]">{c.name}</p>
                                <p className="text-xs text-[#8AA89A]">{c.email}</p>
                                <p className="text-xs text-[#8AA89A]">{c.phone}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', c.accountType === 'member' ? 'bg-[#DDF6E4] text-[#2F855A]' : 'bg-[#EEF1EF] text-[#5E7469]')}>
                              {c.accountType === 'member' ? 'Thành viên' : 'Khách vãng lai'}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            {c.latestOrder ? (
                              <div>
                                <p className="font-semibold text-[#103B2D] text-sm">{c.latestOrder.code}</p>
                                <p className="text-xs text-[#8AA89A]">{c.latestOrder.itemSummary}</p>
                                <p className="text-xs text-[#8AA89A]">{c.latestOrder.schedule.date} • {c.latestOrder.schedule.timeSlot}</p>
                              </div>
                            ) : <span className="text-sm text-[#8AA89A]">Chưa có đơn</span>}
                          </td>
                          <td className="px-5 py-4">
                            {c.latestOrder ? (
                              <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', statusMeta[c.latestOrder.status].tone)}>
                                {statusMeta[c.latestOrder.status].label}
                              </span>
                            ) : <span className="text-[#8AA89A]">—</span>}
                          </td>
                          <td className="px-5 py-4">
                            {c.latestOrder ? (
                              <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', getCustomerFacingStatus(c.latestOrder.status).tone)}>
                                {getCustomerFacingStatus(c.latestOrder.status).label}
                              </span>
                            ) : <span className="text-[#8AA89A]">—</span>}
                          </td>
                          <td className="px-5 py-4 font-semibold text-[#103B2D]">{c.ordersCount}</td>
                          <td className="px-5 py-4 font-semibold text-[#103B2D]">{currency.format(c.totalSpent)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══ TAB: PRICING ════════════════════════════════════════════ */}
          {activeTab === 'pricing' && (
            <div className="animate-fadeIn space-y-4">
              {/* Menu Tabs */}
              <div className="mb-6 flex flex-wrap gap-2">
                {categoriesList.map((cat: string) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedPricingCategory(cat)}
                    className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${
                      selectedPricingCategory === cat
                        ? 'bg-[#103B2D] text-white shadow-md'
                        : 'bg-white border border-[#DFF0E5] text-[#2F855A] hover:bg-[#F3FBF5]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {filteredPricing.map((svc: ServicePriceRecord) => (
                  <article key={svc.id} className="rounded-[24px] border border-[#DFF0E5] bg-white p-5 shadow-[0_8px_30px_rgba(16,59,45,0.05)]">
                    <span className="inline-block rounded-full bg-[#EBF7F0] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#2F855A]">{svc.category}</span>
                    <h3 className="mt-3 text-lg font-bold text-[#103B2D]">{svc.name}</h3>
                    <p className="mt-1 text-xs leading-5 text-[#6D877A]">{svc.note}</p>

                    <div className="my-4 rounded-[18px] bg-[#F7FCF8] p-4 text-center">
                      <p className="text-xs text-[#8AA89A] mb-1">Giá hiện tại</p>
                      <p className="text-2xl font-bold text-[#103B2D]">{currency.format(svc.price)}</p>
                      <p className="text-xs text-[#8AA89A]">{svc.unitLabel}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => adjustServicePrice(svc.id, -10000)}
                        className="rounded-full border border-[#DFF0E5] bg-white py-2.5 text-sm font-semibold text-[#476458] transition-colors hover:bg-red-50 hover:border-red-200 hover:text-red-600">
                        − 10K
                      </button>
                      <button type="button" onClick={() => adjustServicePrice(svc.id, 10000)}
                        className="rounded-full bg-[#103B2D] py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-md">
                        + 10K
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* ══ TAB: ORDERS ═════════════════════════════════════════════ */}
          {activeTab === 'orders' && (
            <div className="animate-fadeIn space-y-5">
              {/* Filter bar */}
              <div className="flex flex-wrap gap-2">
                {statusFilters.map((f) => (
                  <button key={f.id} type="button" onClick={() => setStatusFilter(f.id)}
                    className={cn('rounded-full px-4 py-2 text-sm font-semibold transition-all', statusFilter === f.id ? 'bg-[#103B2D] text-white shadow-sm' : 'bg-white border border-[#DFF0E5] text-[#476458] hover:bg-[#F7FCF8]')}>
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Status chips */}
              <div className="flex flex-wrap gap-3">
                {statusSummary.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 rounded-full border border-[#DFF0E5] bg-white px-4 py-1.5 shadow-sm">
                    <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-bold', s.tone)}>{s.label}</span>
                    <span className="font-bold text-[#103B2D]">{s.count}</span>
                  </div>
                ))}
              </div>

              {/* Order cards — only actionable orders */}
              <div className="space-y-3">
                {orders
                  .filter((o) => statusFilter === 'all' ? true : o.status === statusFilter)
                  .map((o) => {
                    const action = getAdminAction(o);
                    return (
                      <div key={o.id} className="rounded-[24px] border border-[#DFF0E5] bg-white p-5 shadow-[0_4px_20px_rgba(16,59,45,0.04)] transition-shadow hover:shadow-[0_8px_30px_rgba(16,59,45,0.08)]">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap">
                              <p className="font-bold text-[#103B2D]">{o.code}</p>
                              <span className={cn('rounded-full px-3 py-1 text-[11px] font-bold', statusMeta[o.status].tone)}>
                                {statusMeta[o.status].label}
                              </span>
                              <span className="text-xs text-[#8AA89A]">
                                Khách thấy: <span className="font-semibold text-[#476458]">{getCustomerFacingStatus(o.status).label}</span>
                              </span>
                            </div>

                            <p className="mt-2 text-sm text-[#476458]">{o.itemSummary}</p>
                            <p className="mt-1 text-xs text-[#8AA89A]">{o.schedule.date} • {o.schedule.timeSlot} • {o.assignedStaff}</p>

                            <div className="mt-3 grid grid-cols-1 gap-1 sm:grid-cols-2">
                              <p className="text-sm text-[#476458]"><span className="font-semibold text-[#103B2D]">Đánh giá:</span> {o.selfAssessment}</p>
                              <p className="text-sm text-[#476458]"><span className="font-semibold text-[#103B2D]">Giá:</span> {o.priceAdjustment}</p>
                            </div>
                          </div>

                          <div className="flex flex-row items-center gap-3 sm:flex-col sm:items-end">
                            <p className="text-xl font-bold text-[#103B2D] whitespace-nowrap">
                              {o.finalAmount > 0 ? currency.format(o.finalAmount) : <span className="text-sm text-[#8AA89A]">Cần báo giá</span>}
                            </p>
                            {action && (
                              <button type="button" onClick={action.onClick}
                                className={cn('rounded-full px-5 py-2.5 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-md whitespace-nowrap', action.tone)}>
                                {action.label}
                              </button>
                            )}
                            {!action && (
                              <span className="text-xs text-[#8AA89A]">Không cần thao tác</span>
                            )}
                          </div>
                        </div>
                        {action && (
                          <p className="mt-3 text-xs text-[#8AA89A] border-t border-[#F0F7F2] pt-3">💬 {action.helper}</p>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ══ MOBILE BOTTOM NAV ══════════════════════════════════════════ */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-[#DFF0E5] bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_24px_rgba(16,59,45,0.06)] lg:hidden">
        {NAV_ITEMS.map(({ id, label }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'relative flex flex-1 flex-col items-center justify-center gap-1.5 py-3 transition-colors',
                isActive ? 'text-[#103B2D]' : 'text-[#8AA89A] hover:text-[#476458]'
              )}
            >
              {isActive && (
                <span className="absolute left-1/2 top-0 h-[3px] w-8 -translate-x-1/2 rounded-b-full bg-[#2F855A]" />
              )}
              <NavIcon id={id} active={isActive} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
              {id === 'orders' && pendingCount > 0 && (
                <span className="absolute right-3 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[9px] font-bold text-white ring-2 ring-white">
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
