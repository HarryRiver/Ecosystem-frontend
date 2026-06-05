/**
 * Shared store – single source of truth cho users, orders, pricing, và history.
 * Tất cả các trang (user-facing & admin) đều đọc/ghi qua đây.
 */

import { useEffect, useState } from 'react';

// ─── Order Schema ─────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'processing'
  | 'delivering'
  | 'completed'
  | 'cancelled'
  | 'no_show';

/** Task 2: Lifecycle đóng kín — chỉ định nghĩa ở một chỗ này. */
export const ORDER_LIFECYCLE: Record<OrderStatus, OrderStatus[]> = {
  processing: ['delivering', 'cancelled'],
  delivering: ['completed', 'no_show'],
  completed:  [],
  cancelled:  [],
  no_show:    ['cancelled'],
};

/** Kiểm tra chuyển trạng thái hợp lệ */
export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_LIFECYCLE[from]?.includes(to) ?? false;
}

/** Label admin cho từng action chuyển trạng thái */
export const STATUS_ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  delivering: 'Xác nhận đơn',
  completed:  'Hoàn thành đơn',
  cancelled:  'Từ chối đơn',
};

export interface OrderItem {
  name: string;
  quantity: number;
  price: number; // estimatedLineTotal
}

export interface OrderSchedule {
  date: string;      // YYYY-MM-DD hoặc label dạng "Th 2, 13 thg 4"
  timeSlot: string;
}

export interface OrderPricing {
  subtotal: number;
  handlingFee: number;
  total: number;
  hasQuoteItems: boolean;
}

export interface Order {
  id: string;              // e.g. "EC-9482"
  code: string;            // e.g. "EC240401"
  customerId: string;      // e.g. "CUS-01"  (khách đã có tài khoản) hoặc email nếu guest
  status: OrderStatus;
  items: OrderItem[];
  schedule: OrderSchedule;
  pricing: OrderPricing;
  finalAmount: number;     // Số tiền thực thu (admin có thể điều chỉnh)
  notes: string;
  attachments: {
    imageFileName: string | null;
    imageFileSize: number | null;
    imageFileType: string | null;
  };
  // Admin-only fields (mirrored from old adminDashboardMock)
  itemSummary: string;
  paymentMethod: 'cash' | 'online';
  assignedStaff: string;
  selfAssessment: string;
  priceAdjustment: string;
  createdAt: string;       // ISO timestamp
  updatedAt: string;       // ISO timestamp
}

// ─── History Schema (Task 1) ──────────────────────────────────────────────────

export interface HistoryItem {
  id: string;
  date: string;
  status: 'completed' | 'in_progress' | 'cancelled';
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  address: string;
  customerName: string;
  phone: string;
  email: string;
  timeSlot: string;
  handlingMode: string;
  rating?: number;
}

const HISTORY_SEED: HistoryItem[] = [];


// ─── Customer / User Schema ───────────────────────────────────────────────────

export interface CustomerRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  accountType: 'guest' | 'member';
  district: string;
  noShowCount: number;
}

// ─── Pricing Schema ───────────────────────────────────────────────────────────

export interface ServicePriceRecord {
  id: string;
  name: string;
  unitLabel: string;
  category: string;
  price: number;
  note: string;
}

// ─── Task 3: serviceId → BookingModal category mapping ────────────────────────

/**
 * Map từ hero quick-option key (từ i18n namespace hero.quickOptions.*)
 * sang category id trong BookingModal.
 * Hero truyền key lang-agnostic, BookingModal nhận và dùng để filter.
 */
export type HeroQuickOption =
  | 'furniture'
  | 'electronics'
  | 'household'
  | 'construction'
  | 'other';

export const HERO_OPTION_TO_CATEGORY: Record<HeroQuickOption, string> = {
  furniture:    'furniture',
  electronics:  'electronics',
  household:    'household',
  construction: 'other',
  other:        'other',
};

/** Kiểm tra giá trị có phải HeroQuickOption không */
export function isHeroQuickOption(value: string): value is HeroQuickOption {
  return value in HERO_OPTION_TO_CATEGORY;
}

// ─── Storage Keys ─────────────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  orders:    'ecocollect.store.orders.v2',
  customers: 'ecocollect.store.customers.v2',
  pricing:   'ecocollect.store.pricing.v3',
  history:   'ecocollect.store.history.v2',
} as const;

const LEGACY_STORAGE_KEYS = {
  orders:    'ecocollect.store.orders',
  customers: 'ecocollect.store.customers',
} as const;

// ─── Default / Seed Data ─────────────────────────────────────────────────────

export const defaultCustomers: CustomerRecord[] = [];


export const defaultOrders: Order[] = [];


export const defaultPricing: ServicePriceRecord[] = [
  { id: 'sofa-single', name: 'Sofa đơn', unitLabel: '/món', category: 'Nội thất', price: 150000, note: 'Giá chuẩn cho món đơn' },
  { id: 'sofa-large', name: 'Sofa lớn', unitLabel: '/món', category: 'Nội thất', price: 250000, note: 'Sofa lớn, cồng kềnh' },
  { id: 'wardrobe', name: 'Tủ quần áo', unitLabel: '/món', category: 'Nội thất', price: 260000, note: 'Giá chuẩn, có phân loại kích thước' },
  { id: 'kitchen-cabinet', name: 'Tủ bếp', unitLabel: '/món', category: 'Nội thất', price: 120000, note: 'Tủ bếp tháo rời' },
  { id: 'bed', name: 'Giường', unitLabel: '/món', category: 'Nội thất', price: 220000, note: 'Có thể tháo lắp' },
  { id: 'tv', name: 'Tivi', unitLabel: '/món', category: 'Đồ điện tử', price: 80000, note: 'Màn hình & TV' },
  { id: 'fridge', name: 'Tủ lạnh', unitLabel: '/món', category: 'Đồ điện tử', price: 200000, note: 'Cần chú ý cẩn thận khi vận chuyển' },
  { id: 'washer', name: 'Máy giặt', unitLabel: '/món', category: 'Đồ điện tử', price: 180000, note: 'Trọng lượng nặng' },
  { id: 'aircon', name: 'Máy lạnh', unitLabel: '/món', category: 'Đồ điện tử', price: 160000, note: 'Không bao gồm tháo lắp' },
  { id: 'office-furniture', name: 'Bàn ghế văn phòng', unitLabel: '/món', category: 'Nội thất', price: 100000, note: 'Giá trung bình' },
  { id: 'household-bag', name: 'Rác sinh hoạt', unitLabel: '/bao', category: 'Khác', price: 60000, note: 'Đóng bao sẵn' },
  { id: 'construction', name: 'Phế thải xây dựng', unitLabel: '/kg', category: 'Khác', price: 7000, note: 'Cần kiểm tra khối lượng thực tế' },
  { id: 'red-copper', name: 'Đồng đỏ', unitLabel: '/kg', category: 'Kim loại', price: 150000, note: 'Khảo sát giá theo thời điểm' },
  { id: 'yellow-copper', name: 'Đồng vàng', unitLabel: '/kg', category: 'Kim loại', price: 90000, note: 'Khảo sát giá theo thời điểm' },
  { id: 'aluminum', name: 'Nhôm', unitLabel: '/kg', category: 'Kim loại', price: 25000, note: 'Khảo sát giá theo thời điểm' },
  { id: 'stainless-steel', name: 'Inox', unitLabel: '/kg', category: 'Kim loại', price: 15000, note: 'Khảo sát giá theo thời điểm' },
  { id: 'iron', name: 'Sắt vụn', unitLabel: '/kg', category: 'Kim loại', price: 8000, note: 'Khảo sát giá theo thời điểm' },
  { id: 'plastic-pet', name: 'Nhựa PET', unitLabel: '/kg', category: 'Nhựa', price: 8000, note: 'Theo kg' },
  { id: 'plastic-hard', name: 'Nhựa cứng', unitLabel: '/kg', category: 'Nhựa', price: 10000, note: 'Theo kg' },
  { id: 'plastic-soft', name: 'Nhựa dẻo', unitLabel: '/kg', category: 'Nhựa', price: 5000, note: 'Theo kg' },
  { id: 'paper-carton', name: 'Carton', unitLabel: '/kg', category: 'Giấy', price: 3000, note: 'Giấy carton ép' },
  { id: 'paper-white', name: 'Giấy trắng', unitLabel: '/kg', category: 'Giấy', price: 5000, note: 'Giấy vụn văn phòng' },
  { id: 'paper-news', name: 'Giấy báo', unitLabel: '/kg', category: 'Giấy', price: 4000, note: 'Giấy báo cũ' },
  { id: 'clothes-normal', name: 'Quần áo thường', unitLabel: '/kg', category: 'Quần áo cũ', price: 5000, note: 'Tính kg' },
  { id: 'clothes-premium', name: 'Đồ đẹp (second-hand)', unitLabel: '/món', category: 'Quần áo cũ', price: 50000, note: 'Định giá theo món' },
  { id: 'clothes-scraps', name: 'Vải vụn', unitLabel: '/kg', category: 'Quần áo cũ', price: 3000, note: 'Vải rách, vải vụn' },
  { id: 'vehicle-motorcycle', name: 'Xe máy hỏng', unitLabel: '/món', category: 'Xe cũ', price: 1000000, note: 'Thu mua nguyên chiếc' },
  { id: 'vehicle-bicycle', name: 'Xe đạp', unitLabel: '/món', category: 'Xe cũ', price: 100000, note: 'Tùy tình trạng' },
];

// ─── Storage Helpers ──────────────────────────────────────────────────────────

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function clearLegacyAdminStorage() {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(LEGACY_STORAGE_KEYS.orders);
    window.localStorage.removeItem(LEGACY_STORAGE_KEYS.customers);
  } catch {
    // ignore cleanup failures
  }
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore write failures in demo
  }
}

// ─── Orders API ───────────────────────────────────────────────────────────────

export function readOrders(): Order[] {
  clearLegacyAdminStorage();
  return readJson<Order[]>(STORAGE_KEYS.orders, defaultOrders);
}

export function writeOrders(orders: Order[]) {
  writeJson(STORAGE_KEYS.orders, orders);
}

export function updateOrderStatus(
  orders: Order[],
  orderId: string,
  nextStatus: OrderStatus,
  finalAmount?: number,
): Order[] {
  const now = new Date().toISOString();
  return orders.map((o) =>
    o.id === orderId
      ? {
          ...o,
          status: nextStatus,
          finalAmount: finalAmount !== undefined ? finalAmount : o.finalAmount,
          updatedAt: now,
        }
      : o,
  );
}

/** Thêm đơn mới vào store (gọi khi user submit booking) */
export function appendOrder(orders: Order[], newOrder: Order): Order[] {
  return [newOrder, ...orders];
}

// ─── History API (Task 1) ─────────────────────────────────────────────────────

export function readHistory(): HistoryItem[] {
  const saved = readJson<HistoryItem[]>(STORAGE_KEYS.history, []);
  if (saved.length === 0) return HISTORY_SEED;
  // Merge: saved items first, then seed items that aren't in saved
  const combined = [...saved];
  HISTORY_SEED.forEach((seed) => {
    if (!combined.find((item) => item.id === seed.id)) {
      combined.push(seed);
    }
  });
  return combined;
}

export function writeHistory(items: HistoryItem[]) {
  writeJson(STORAGE_KEYS.history, items);
}

/** Thêm đơn mới vào history và persist */
export function appendHistory(items: HistoryItem[], newItem: HistoryItem): HistoryItem[] {
  const next = [newItem, ...items];
  writeHistory(next);
  return next;
}

// ─── Customers API ────────────────────────────────────────────────────────────

export function readCustomers(): CustomerRecord[] {
  clearLegacyAdminStorage();
  return readJson<CustomerRecord[]>(STORAGE_KEYS.customers, defaultCustomers);
}

export function writeCustomers(customers: CustomerRecord[]) {
  writeJson(STORAGE_KEYS.customers, customers);
}

// ─── Pricing API ──────────────────────────────────────────────────────────────

export function readPricing(): ServicePriceRecord[] {
  const saved = readJson<ServicePriceRecord[]>(STORAGE_KEYS.pricing, defaultPricing);
  return saved.length === 0 ? defaultPricing : saved;
}

export function writePricing(pricing: ServicePriceRecord[]) {
  writeJson(STORAGE_KEYS.pricing, pricing);
}

// ─── Shared Formatter ────────────────────────────────────────────────────────

export const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

// ─── Status Meta ─────────────────────────────────────────────────────────────

export const statusMeta: Record<OrderStatus, { label: string; tone: string }> = {
  processing: { label: 'Đang xử lý', tone: 'bg-amber-100 text-amber-700' },
  delivering: { label: 'Đang giao hàng', tone: 'bg-sky-100 text-sky-700' },
  completed:  { label: 'Đã hoàn thành', tone: 'bg-teal-100 text-teal-700' },
  cancelled:  { label: 'Đã hủy', tone: 'bg-slate-200 text-slate-700' },
  no_show:    { label: 'Không có mặt', tone: 'bg-rose-100 text-rose-700' },
};

export const statusFilters: Array<{ id: 'all' | OrderStatus; label: string }> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'processing', label: 'Đang xử lý' },
  { id: 'delivering', label: 'Đang giao hàng' },
  { id: 'completed', label: 'Đã hoàn thành' },
  { id: 'no_show', label: 'Không có mặt' },
];

export function getCustomerFacingStatus(status: OrderStatus) {
  if (status === 'completed') return { label: 'Đã hoàn thành', tone: 'bg-teal-100 text-teal-700' };
  if (status === 'cancelled') return { label: 'Đã hủy', tone: 'bg-slate-200 text-slate-700' };
  if (status === 'no_show')   return { label: 'Không hoàn thành', tone: 'bg-rose-100 text-rose-700' };
  return { label: 'Đang xử lý', tone: 'bg-amber-100 text-amber-700' };
}

// ─── Task 4: Multi-tab Sync via BroadcastChannel ──────────────────────────────

/**
 * useSyncStore<T> – React hook đồng bộ dữ liệu giữa các tab
 * bằng BroadcastChannel (nếu có) hoặc storage event fallback.
 *
 * Trả về [value, setValue] tương tự useState nhưng:
 * - Ghi vào localStorage mỗi khi setValue được gọi
 * - Lắng nghe thay đổi từ tab khác và cập nhật state tự động
 */
export function useSyncStore<T>(
  storageKey: string,
  initialValue: T,
): [T, (next: T | ((prev: T) => T)) => void] {
  const [value, setValueInternal] = useState<T>(() =>
    readJson<T>(storageKey, initialValue),
  );

  useEffect(() => {
    // BroadcastChannel — nhanh hơn storage event, không fire cho chính tab hiện tại
    const channelName = `ecocollect_sync_${storageKey}`;
    let channel: BroadcastChannel | null = null;

    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel(channelName);
      channel.onmessage = (event: MessageEvent<T>) => {
        setValueInternal(event.data);
      };
    }

    // Storage event — fallback cho browser không hỗ trợ BroadcastChannel
    // (chỉ fire ở tab khác, không fire ở tab hiện tại)
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== storageKey || event.newValue === null) return;
      try {
        const parsed = JSON.parse(event.newValue) as T;
        setValueInternal(parsed);
      } catch {
        // ignore parse errors
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorage);
    }

    return () => {
      channel?.close();
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorage);
      }
    };
  }, [storageKey]);

  const setValue = (next: T | ((prev: T) => T)) => {
    setValueInternal((prev) => {
      const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
      writeJson(storageKey, resolved);

      // Broadcast sang các tab khác
      if (typeof BroadcastChannel !== 'undefined') {
        try {
          const ch = new BroadcastChannel(`ecocollect_sync_${storageKey}`);
          ch.postMessage(resolved);
          ch.close();
        } catch {
          // ignore
        }
      }

      return resolved;
    });
  };

  return [value, setValue];
}
