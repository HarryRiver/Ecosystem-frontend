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
  deleteAdminService,
  markOrderNoShow,
  getServiceVariants,
  updateServiceVariant,
  deleteServiceVariant,
  getAdminReviews,
  deleteAdminReview,
  createAdminReview,
  updateAdminReview,
} from '../services/admin.service';
import AdminVouchersPage from './admin/AdminVouchersPage';
import {
  findCustomerForOrder,
  getPaginatedItems,
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
type Tab = 'overview' | 'users' | 'services' | 'pricing' | 'orders' | 'reviews' | 'vouchers';

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
  { id: 'services', label: 'Dịch vụ', desc: 'Danh mục & sản phẩm' },
  { id: 'pricing',  label: 'Bảng giá', desc: 'Cập nhật giá dịch vụ' },
  { id: 'orders',   label: 'Đơn hàng', desc: 'Xác nhận & chốt đơn' },
  { id: 'vouchers', label: 'Khuyến mãi', desc: 'Mã giảm giá, quà tặng' },
  { id: 'reviews',  label: 'Đánh giá', desc: 'Phản hồi từ khách' },
];

function IconServices({ active }: { active?: boolean }) {
  return (
    <svg className={cn('h-5 w-5 transition-colors', active ? 'text-[#2F855A]' : 'text-[#6D877A]')} fill="none" strokeWidth={1.8} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

function IconReviews({ active }: { active?: boolean }) {
  return (
    <svg className={cn('h-5 w-5 transition-colors', active ? 'text-[#2F855A]' : 'text-[#6D877A]')} fill="none" strokeWidth={1.8} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
    </svg>
  );
}

function IconVouchers({ active }: { active?: boolean }) {
  return (
    <svg className={cn('h-5 w-5 transition-colors', active ? 'text-[#2F855A]' : 'text-[#6D877A]')} fill="none" strokeWidth={1.8} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
    </svg>
  );
}

function NavIcon({ id, active }: { id: Tab; active?: boolean }) {
  if (id === 'overview') return <IconDashboard active={active} />;
  if (id === 'users')    return <IconUsers active={active} />;
  if (id === 'services') return <IconServices active={active} />;
  if (id === 'pricing')  return <IconPricing active={active} />;
  if (id === 'vouchers') return <IconVouchers active={active} />;
  if (id === 'reviews')  return <IconReviews active={active} />;
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
  const [apiRawServices, setApiRawServices] = useState<any[]>([]);
  const [selectedApiServiceGroup, setSelectedApiServiceGroup] = useState<any | null>(null);
  const [selectedApiServiceVariants, setSelectedApiServiceVariants] = useState<any[] | null>(null);
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);
  const [isAdminApiLoading, setIsAdminApiLoading] = useState(false);
  const [adminApiNotice, setAdminApiNotice] = useState<string | null>(null);
  const [adminReviews, setAdminReviews] = useState<any[]>([]);
  const [isAdminReviewsLoading, setIsAdminReviewsLoading] = useState(false);
  const [reviewModal, setReviewModal] = useState<{ id?: string | number, reviewer_name: string, reviewer_email: string, rating: number, comment: string } | null>(null);

  const handleSaveReview = async () => {
    if (!reviewModal) return;
    try {
      if (reviewModal.id) {
        const res = await updateAdminReview(reviewModal.id, reviewModal);
        setAdminReviews(cur => cur.map(r => r.id === reviewModal.id ? res : r));
      } else {
        const res = await createAdminReview(reviewModal);
        setAdminReviews(cur => [res, ...cur]);
      }
      setReviewModal(null);
    } catch (err) { alert('Lỗi khi lưu đánh giá!'); }
  };
  
  useEffect(() => {
    if (activeTab === 'reviews') {
      setIsAdminReviewsLoading(true);
      getAdminReviews().then(data => {
        setAdminReviews(data);
      }).catch(err => {
        console.error(err);
      }).finally(() => setIsAdminReviewsLoading(false));
    }
  }, [activeTab]);

  // Modal states for Editing so it looks beautiful
  const [editServiceModal, setEditServiceModal] = useState<{ id: string; currentName: string } | null>(null);
  const [editVariantModal, setEditVariantModal] = useState<{ id: string; label: string; code: string; size: string; price: number; active: boolean; } | null>(null);

  const handleSaveService = async () => {
    if (!editServiceModal) return;
    try {
      const res = await updateAdminService(editServiceModal.id, { name: editServiceModal.currentName });
      setApiRawServices((cur) => cur.map(c => c.id === editServiceModal.id ? { ...c, name: res.name } : c));
      setEditServiceModal(null);
    } catch (err) { alert('Lỗi khi lưu tên dịch vụ!'); }
  };

  const handleSaveVariant = async () => {
    if (!editVariantModal) return;
    try {
      const payload = {
        label: editVariantModal.label,
        code: editVariantModal.code,
        size: editVariantModal.size,
        price: editVariantModal.price,
        active: editVariantModal.active,
      };
      const res = await updateServiceVariant(editVariantModal.id, payload);
      setSelectedApiServiceVariants((cur) => (cur || []).map(item => item.id === editVariantModal.id ? res : item));
      setEditVariantModal(null);
    } catch (err) { alert('Lỗi cập nhật sản phẩm!'); }
  };

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

      const failedResources: string[] = [];
      let loadedAnyAdminData = false;
      let nextCustomers = readCustomers();

      if (metricsResult.status === 'fulfilled') {
        setMetrics(metricsResult.value);
        loadedAnyAdminData = true;
      } else {
        failedResources.push('thống kê');
        console.error('[Admin] API failed:', metricsResult.reason);
      }

      if (ordersResult.status === 'fulfilled') {
        const apiOrders = getPaginatedItems(ordersResult.value);
        loadedAnyAdminData = loadedAnyAdminData || apiOrders.length > 0;
        const nextOrders = apiOrders.map(mapApiOrderToStoreOrder);
        setOrders(nextOrders);
        nextCustomers = mergeCustomerRecords(
          nextCustomers,
          apiOrders.map(mapApiOrderToCustomerRecord),
        );
      } else {
        failedResources.push('đơn hàng');
        console.error('[Admin] API failed:', ordersResult.reason);
      }

      if (usersResult.status === 'fulfilled') {
        const apiUsers = getPaginatedItems(usersResult.value);
        loadedAnyAdminData = loadedAnyAdminData || apiUsers.length > 0;
        nextCustomers = mergeCustomerRecords(
          nextCustomers,
          apiUsers.map(mapApiUserToCustomerRecord),
        );
      } else {
        failedResources.push('khách hàng');
        console.error('[Admin] API failed:', usersResult.reason);
      }

      if (servicesResult.status === 'fulfilled') {
        const apiServices = getPaginatedItems(servicesResult.value);
        loadedAnyAdminData = loadedAnyAdminData || apiServices.length > 0;
        setApiRawServices(apiServices);
        setServicePricing(apiServices.map(mapApiServiceToServicePriceRecord));
      } else {
        failedResources.push('dịch vụ');
        console.error('[Admin] API failed:', servicesResult.reason);
      }

      setCustomers(nextCustomers);
      setAdminApiNotice(
        failedResources.length > 0 && !loadedAnyAdminData
          ? `Không tải được dữ liệu admin: ${failedResources.join(', ')}.`
          : null,
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
              {activeTab === 'services' && 'Danh mục sản phẩm'}
              {activeTab === 'pricing'  && 'Bảng giá dịch vụ'}
              {activeTab === 'vouchers' && 'Quản lý Khuyến mãi'}
              {activeTab === 'orders'   && 'Quản lý đơn hàng'}
              {activeTab === 'reviews'  && 'Quản lý Đánh Giá'}
            </h1>
            <p className="mt-0.5 truncate text-xs text-[#6D877A] lg:text-sm">
              {activeTab === 'overview' && 'Số liệu & tình trạng hoạt động'}
              {activeTab === 'users'    && `${customerRows.length} khách hàng`}
              {activeTab === 'services' && 'Các nhóm dịch vụ hiện có'}
              {activeTab === 'pricing'  && 'Điều chỉnh giá trực tiếp'}
              {activeTab === 'vouchers' && 'Tạo và phân phối mã giảm giá'}
              {activeTab === 'orders'   && `${pendingCount} đơn cần xử lý`}
              {activeTab === 'reviews'  && 'Phản hồi từ khách hàng'}
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

          {/* ══ TAB: SERVICES ════════════════════════════════════════════ */}
          {activeTab === 'services' && selectedApiServiceGroup && (
            <div className="animate-fadeIn space-y-4">
              <button
                onClick={() => setSelectedApiServiceGroup(null)}
                className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#476458] hover:text-[#2F855A] transition-colors"
              >
                ← Quay lại danh mục
              </button>
              
              <div className="rounded-[24px] border border-[#DFF0E5] bg-white p-6 shadow-[0_8px_30px_rgba(16,59,45,0.05)]">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-[#103B2D]">{selectedApiServiceGroup.name} <span className="text-[#8AA89A] text-lg font-medium ml-2">({selectedApiServiceGroup.category === 'other' ? 'Khác' : selectedApiServiceGroup.category})</span></h2>
                  <p className="text-sm text-[#476458] mt-1">Danh sách các sản phẩm/biến thể thuộc nhóm dịch vụ này.</p>
                </div>

                {isLoadingVariants ? (
                  <div className="py-12 text-center text-[#8AA89A] font-medium animate-pulse">
                    Đang tải danh sách sản phẩm...
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-[#EEF8F1]">
                          <th className="px-4 py-3 font-bold uppercase tracking-[0.14em] text-[#8AA89A] text-[11px]">Sản phẩm / Món</th>
                          <th className="px-4 py-3 font-bold uppercase tracking-[0.14em] text-[#8AA89A] text-[11px]">Mã (Code)</th>
                          <th className="px-4 py-3 font-bold uppercase tracking-[0.14em] text-[#8AA89A] text-[11px]">Kích cỡ</th>
                          <th className="px-4 py-3 font-bold uppercase tracking-[0.14em] text-[#8AA89A] text-[11px]">Giá tiền</th>
                          <th className="px-4 py-3 font-bold uppercase tracking-[0.14em] text-[#8AA89A] text-[11px]">Trạng thái</th>
                          <th className="px-4 py-3 font-bold uppercase tracking-[0.14em] text-[#8AA89A] text-[11px]">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedApiServiceVariants || []).map((v: any, i: number) => {
                          const unitMap: any = { item: 'món', kg: 'kg', bag: 'bao' };
                          const unit = unitMap[v.unit] || 'món';
                          return (
                            <tr key={v.id} className={cn('border-b border-[#F0F7F2] transition-colors hover:bg-[#F7FCF8]', i % 2 === 1 && 'bg-[#FAFCFB]')}>
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                  {v.icon && <span className="text-xl">{v.icon}</span>}
                                  <span className="font-semibold text-[#103B2D]">{v.label}</span>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-[#6D877A] font-mono text-xs">{v.code}</td>
                              <td className="px-4 py-4 text-[#476458]">{v.size || '—'}</td>
                              <td className="px-4 py-4 font-bold text-[#103B2D]">
                                {v.price > 0 ? `${currency.format(v.price)} / ${unit}` : <span className="text-[#8AA89A]">Báo giá riêng</span>}
                              </td>
                              <td className="px-4 py-4">
                                <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-bold', v.active ? 'bg-[#EBF7F0] text-[#2F855A]' : 'bg-[#F2F2F2] text-[#8AA89A]')}>
                                  {v.active ? 'Đang hoạt động' : 'Tạm ẩn'}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setEditVariantModal({ 
                                      id: v.id, 
                                      label: v.label,
                                      code: v.code || '',
                                      size: v.size || '',
                                      price: v.price || 0,
                                      active: v.active !== false
                                    })}
                                    className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[11px] font-bold hover:bg-blue-100 transition-colors"
                                  >
                                    Cập nhật
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (!window.confirm(`Xóa món "${v.label}"?`)) return;
                                      try {
                                        await deleteServiceVariant(v.id);
                                        setSelectedApiServiceVariants((cur) => (cur || []).filter(item => item.id !== v.id));
                                      } catch (err) { alert('Lỗi khi xóa!'); }
                                    }}
                                    className="px-2 py-1 bg-red-50 text-red-600 rounded text-[11px] font-bold hover:bg-red-100"
                                  >
                                    Xóa
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {(!selectedApiServiceVariants || selectedApiServiceVariants.length === 0) && (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-[#8AA89A]">Không có sản phẩm nào.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'services' && !selectedApiServiceGroup && (
            <div className="animate-fadeIn space-y-4">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {apiRawServices.map((service: any) => {
                  const iconMap: Record<string, string> = {
                    furniture: '🛋️',
                    electronics: '📺',
                    metals: '🔩',
                    plastics: '🪣',
                    paper: '📦',
                    clothes: '👕',
                    vehicles: '🛵',
                    other: '🧱',
                  };
                  const icon = iconMap[service.code] || '📦';
                  const description = service.category === 'other' ? 'Khác' : (service.name || 'Danh mục');
                  const getPriceLabel = (s: any) => {
                    if (s.pricing_type === 'quote') return 'Cần báo giá';
                    const formater = new Intl.NumberFormat('vi-VN');
                    const unitMap: any = { item: 'món', kg: 'kg', bag: 'bao' };
                    return `Từ ${formater.format(s.base_price || 0)}đ / ${unitMap[s.default_unit] || 'món'}`;
                  };
                  const priceLabel = getPriceLabel(service);
                  const variants = Array.from(new Set((service.variants || []).map((v: any) => v.label)));

                  return (
                    <article
                      key={service.id}
                      onClick={() => {
                        setSelectedApiServiceGroup(service);
                        setSelectedApiServiceVariants(null);
                        setIsLoadingVariants(true);
                        getServiceVariants(service.id).then((vars) => {
                          setSelectedApiServiceVariants(vars);
                          setIsLoadingVariants(false);
                        }).catch(e => {
                          console.error(e);
                          setIsLoadingVariants(false);
                        });
                      }}
                      className="group cursor-pointer flex flex-col rounded-[28px] border border-[#D6EEDD] bg-[#F7FCF8] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#2F855A] hover:shadow-[0_18px_45px_rgba(16,59,45,0.08)]"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm transition-transform duration-300 group-hover:scale-110">
                          {icon}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="rounded-full bg-[#E7F8EC] px-3 py-1 text-sm font-bold text-[#2F855A] transition-colors">
                            {priceLabel}
                          </span>
                          <div className="flex gap-2 opacity-50 hover:opacity-100 transition-opacity">
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditServiceModal({ id: service.id, currentName: service.name });
                              }}
                              className="text-[10px] font-bold text-blue-600 cursor-pointer bg-blue-50 px-2 py-0.5 rounded hover:bg-blue-100 transition-colors"
                            >
                              Sửa tên
                            </span>
                            <span 
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (!window.confirm(`Xóa nhóm ${service.name}?`)) return;
                                try {
                                  await deleteAdminService(service.id);
                                  setApiRawServices(cur => cur.filter(c => c.id !== service.id));
                                } catch(err) { alert('Có thể có lỗi ràng buộc khóa ngoại (constraint error). Vui lòng xóa các sp con trước!'); }
                              }}
                              className="text-[10px] font-bold text-red-600 cursor-pointer bg-red-50 px-2 py-0.5 rounded"
                            >
                              Xóa
                            </span>
                          </div>
                        </div>
                      </div>

                      <h3 className="mb-2 mt-2 text-xl font-bold text-[#103B2D]">
                        {service.name}
                      </h3>
                      <p className="mb-4 text-sm text-[#8AA89A] font-medium tracking-wide">
                        {description}
                      </p>

                      <div className="flex flex-wrap gap-2 flex-1 mb-6 content-start">
                        {variants.map((item: any, idx: number) => (
                          <span
                            key={idx}
                            className="rounded-full bg-white border border-[#E8F5EC] px-3 py-1.5 text-xs font-semibold text-[#476458]"
                          >
                            {item}
                          </span>
                        ))}
                      </div>

                      <button className="flex w-full items-center justify-between border-t border-[#D6EEDD] pt-4 opacity-75">
                        <span className="text-[11px] uppercase tracking-wider font-semibold text-[#8AA89A]">
                          Quản lý các sản phẩm con
                        </span>
                        <span className="text-sm font-bold text-[#2F855A]">Cập nhật</span>
                      </button>
                    </article>
                  );
                })}
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

          {/* ══ TAB: REVIEWS ═════════════════════════════════════════════ */}
          {activeTab === 'reviews' && (
            <div className="animate-fadeIn space-y-4">
              <div className="mb-4 flex flex-wrap gap-4 items-center justify-between">
                <h2 className="text-lg font-bold text-[#103B2D]">Danh sách đánh giá</h2>
                <button
                  onClick={() => setReviewModal({ reviewer_name: '', reviewer_email: '', rating: 5, comment: '' })}
                  className="rounded-full bg-[#103B2D] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  + Thêm đánh giá
                </button>
              </div>

              {isAdminReviewsLoading ? (
                <div className="py-12 text-center text-[#8AA89A] font-medium animate-pulse">
                  Đang tải danh sách đánh giá...
                </div>
              ) : adminReviews.length === 0 ? (
                <div className="py-12 text-center text-[#8AA89A] font-medium">
                  Chưa có đánh giá nào từ khách hàng.
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {adminReviews.map((review) => (
                    <div key={review.id} className="rounded-[24px] border border-[#DFF0E5] bg-white p-5 shadow-[0_8px_30px_rgba(16,59,45,0.05)] relative flex flex-col">
                      <div className="absolute right-4 top-4 flex gap-2">
                        <button
                          onClick={() => setReviewModal({
                            id: review.id,
                            reviewer_name: review.reviewer_name,
                            reviewer_email: review.reviewer_email,
                            rating: review.rating,
                            comment: review.comment
                          })}
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-50 text-blue-500 hover:bg-blue-100 font-bold transition-colors text-xs"
                          title="Sửa"
                        >
                          ✎
                        </button>
                        <button
                          onClick={async () => {
                            if (!window.confirm('Xóa đánh giá này?')) return;
                            try {
                              await deleteAdminReview(review.id);
                              setAdminReviews(cur => cur.filter(r => r.id !== review.id));
                            } catch (e) { alert('Lỗi xóa đánh giá') }
                          }}
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 font-bold transition-colors"
                          title="Xóa"
                        >
                          ×
                        </button>
                      </div>
                      <div className="flex items-center space-x-1 text-yellow-400 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < review.rating ? 'text-yellow-400' : 'text-gray-200'}>★</span>
                        ))}
                      </div>
                      <p className="text-[#303030]/80 italic mb-4 flex-1 text-sm leading-relaxed">"{review.comment}"</p>
                      <div className="border-t border-[#F0F7F2] pt-3 mt-auto">
                        <p className="font-bold text-[#103B2D] text-sm">{review.reviewer_name}</p>
                        <p className="text-xs text-[#8AA89A]">{review.reviewer_email}</p>
                        <p className="text-[10px] uppercase font-bold text-[#6D877A] mt-2 tracking-widest">{new Date(review.created_at).toLocaleString('vi-VN')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ TAB: VOUCHERS ════════════════════════════════════════════ */}
          {activeTab === 'vouchers' && <AdminVouchersPage />}

        </div>
      </main>

      {/* Review Modal Logic Below */}

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
      {/* ══ MODALS ═════════════════════════════════════════════ */}
      {editServiceModal && (
        <div className="fixed inset-0 z-[100] flex animate-fadeIn items-center justify-center bg-[#103B2D]/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[24px] bg-white p-6 shadow-[0_30px_60px_rgba(16,59,45,0.15)] transform transition-transform duration-200">
            <h3 className="mb-4 text-xl font-bold text-[#103B2D]">Đổi tên Dịch vụ</h3>
            <input 
              autoFocus
              className="w-full rounded-xl border border-[#DFF0E5] bg-[#FAFCFB] px-4 py-3 text-[#103B2D] focus:border-[#2F855A] focus:outline-none focus:ring-4 focus:ring-[#2F855A]/10 font-bold placeholder:font-normal placeholder:text-[#8AA89A]"
              value={editServiceModal.currentName}
              placeholder="Nhập tên dịch vụ mới..."
              onChange={(e) => setEditServiceModal({ ...editServiceModal, currentName: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveService();
                if (e.key === 'Escape') setEditServiceModal(null);
              }}
            />
            <div className="mt-6 flex gap-3">
              <button 
                onClick={() => setEditServiceModal(null)}
                className="flex-[0.4] rounded-full bg-[#F2F2F2] py-2.5 font-bold text-[#6D877A] hover:bg-[#E5E5E5] transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={handleSaveService}
                className="flex-[0.6] rounded-full bg-[#2F855A] py-2.5 font-bold text-white hover:bg-[#246946] transition-colors"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {editVariantModal && (
        <div className="fixed inset-0 z-[100] flex animate-fadeIn items-center justify-center bg-[#103B2D]/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-[0_30px_60px_rgba(16,59,45,0.15)] transform transition-transform duration-200">
            <h3 className="mb-4 text-xl font-bold text-[#103B2D]">Cập nhật Sản phẩm</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-[#6D877A] uppercase tracking-wider mb-1 block">Tên sản phẩm / Món</label>
                <input 
                  className="w-full rounded-xl border border-[#DFF0E5] bg-[#FAFCFB] px-4 py-2.5 text-[#103B2D] focus:border-[#2F855A] focus:outline-none focus:ring-4 focus:ring-[#2F855A]/10 font-bold placeholder:font-normal text-sm"
                  value={editVariantModal.label}
                  onChange={(e) => setEditVariantModal({ ...editVariantModal, label: e.target.value })}
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-[#6D877A] uppercase tracking-wider mb-1 block">Mã (Code)</label>
                  <input 
                    className="w-full rounded-xl border border-[#DFF0E5] bg-[#FAFCFB] px-4 py-2.5 text-[#103B2D] focus:border-[#2F855A] focus:outline-none focus:ring-4 focus:ring-[#2F855A]/10 font-mono text-xs"
                    value={editVariantModal.code}
                    onChange={(e) => setEditVariantModal({ ...editVariantModal, code: e.target.value })}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-[#6D877A] uppercase tracking-wider mb-1 block">Kích cỡ</label>
                  <input 
                    className="w-full rounded-xl border border-[#DFF0E5] bg-[#FAFCFB] px-4 py-2.5 text-[#103B2D] focus:border-[#2F855A] focus:outline-none focus:ring-4 focus:ring-[#2F855A]/10 text-sm"
                    value={editVariantModal.size}
                    placeholder=" VD: Cỡ lớn, Nhỏ..."
                    onChange={(e) => setEditVariantModal({ ...editVariantModal, size: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#6D877A] uppercase tracking-wider mb-1 block">Giá tiền</label>
                <div className="relative">
                  <input 
                    type="number" min={0} step={1000}
                    className="w-full rounded-xl border border-[#DFF0E5] bg-[#FAFCFB] px-4 py-2.5 text-[#103B2D] focus:border-[#2F855A] focus:outline-none focus:ring-4 focus:ring-[#2F855A]/10 font-bold"
                    value={editVariantModal.price || ''}
                    onChange={(e) => setEditVariantModal({ ...editVariantModal, price: parseInt(e.target.value) || 0 })}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#8AA89A] pointer-events-none">VND</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input 
                  type="checkbox" 
                  id="activeVariant"
                  checked={editVariantModal.active}
                  onChange={(e) => setEditVariantModal({ ...editVariantModal, active: e.target.checked })}
                  className="h-4 w-4 rounded border-[#DFF0E5] text-[#2F855A] focus:ring-[#2F855A]/20 transition-colors"
                />
                <label htmlFor="activeVariant" className="text-sm font-bold text-[#103B2D] cursor-pointer selection:bg-transparent">
                  Đang hoạt động (Hiển thị cho khách)
                </label>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button 
                onClick={() => setEditVariantModal(null)}
                className="flex-[0.4] rounded-full bg-[#F2F2F2] py-2.5 font-bold text-[#6D877A] hover:bg-[#E5E5E5] transition-colors"
               >
                Hủy
              </button>
              <button 
                onClick={handleSaveVariant}
                className="flex-[0.6] rounded-full bg-[#185BD6] py-2.5 font-bold text-white hover:bg-[#1242A0] transition-colors"
              >
                Lưu Thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {reviewModal && (
        <div className="fixed inset-0 z-[100] flex animate-fadeIn items-center justify-center bg-[#103B2D]/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-[0_30px_60px_rgba(16,59,45,0.15)] transform transition-transform duration-200">
            <h3 className="mb-4 text-xl font-bold text-[#103B2D]">{reviewModal.id ? 'Sửa đánh giá' : 'Thêm đánh giá mới'}</h3>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-[#6D877A] uppercase tracking-wider mb-1 block">Tên khách hàng</label>
                  <input 
                    className="w-full rounded-xl border border-[#DFF0E5] bg-[#FAFCFB] px-4 py-2.5 text-[#103B2D] focus:border-[#2F855A] focus:outline-none focus:ring-4 focus:ring-[#2F855A]/10 text-sm font-bold"
                    value={reviewModal.reviewer_name}
                    onChange={(e) => setReviewModal({ ...reviewModal, reviewer_name: e.target.value })}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-[#6D877A] uppercase tracking-wider mb-1 block">Email</label>
                  <input 
                    className="w-full rounded-xl border border-[#DFF0E5] bg-[#FAFCFB] px-4 py-2.5 text-[#103B2D] focus:border-[#2F855A] focus:outline-none focus:ring-4 focus:ring-[#2F855A]/10 text-sm"
                    value={reviewModal.reviewer_email}
                    onChange={(e) => setReviewModal({ ...reviewModal, reviewer_email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#6D877A] uppercase tracking-wider mb-1 block">Số sao (1-5)</label>
                <input 
                  type="number" min={1} max={5}
                  className="w-full rounded-xl border border-[#DFF0E5] bg-[#FAFCFB] px-4 py-2.5 text-[#103B2D] focus:border-[#2F855A] focus:outline-none focus:ring-4 focus:ring-[#2F855A]/10 font-bold"
                  value={reviewModal.rating}
                  onChange={(e) => setReviewModal({ ...reviewModal, rating: parseInt(e.target.value) || 5 })}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#6D877A] uppercase tracking-wider mb-1 block">Nội dung đánh giá</label>
                <textarea 
                  rows={4}
                  className="w-full rounded-xl border border-[#DFF0E5] bg-[#FAFCFB] px-4 py-2.5 text-[#103B2D] focus:border-[#2F855A] focus:outline-none focus:ring-4 focus:ring-[#2F855A]/10 text-sm"
                  value={reviewModal.comment}
                  onChange={(e) => setReviewModal({ ...reviewModal, comment: e.target.value })}
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button 
                onClick={() => setReviewModal(null)}
                className="flex-[0.4] rounded-full bg-[#F2F2F2] py-2.5 font-bold text-[#6D877A] hover:bg-[#E5E5E5] transition-colors"
               >
                Hủy
              </button>
              <button 
                onClick={handleSaveReview}
                className="flex-[0.6] rounded-full bg-[#185BD6] py-2.5 font-bold text-white hover:bg-[#1242A0] transition-colors"
              >
                Lưu Thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
