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

/*
const HISTORY_SEED_MOCK: HistoryItem[] = [
  {
    id: 'EC-9482',
    date: '03/04/2026',
    status: 'completed',
    customerName: 'Hà Đức Lâm',
    phone: '0784514373',
    email: 'haduclam2005@gmail.com',
    address: 'Số 9 An Thượng 5, Quận Ngũ Hành Sơn, Đà Nẵng',
    timeSlot: 'Th 2, 13 thg 4 • 12:00 - 14:00',
    handlingMode: 'Vào tận nhà bê đồ',
    items: [
      { name: 'Sofa đơn', quantity: 2, price: 300000 },
      { name: 'Tủ quần áo', quantity: 1, price: 180000 },
    ],
    total: 780000,
  },
  {
    id: 'EC-8551',
    date: '01/04/2026',
    status: 'completed',
    customerName: 'Hà Đức Lâm',
    phone: '0784514373',
    email: 'haduclam2005@gmail.com',
    address: 'Số 9 An Thượng 5, Quận Ngũ Hành Sơn, Đà Nẵng',
    timeSlot: 'Th 6, 10 thg 4 • 08:00 - 10:00',
    handlingMode: 'Để ngoài cửa',
    items: [
      { name: 'Máy giặt', quantity: 1, price: 150000 },
      { name: 'Tủ bếp', quantity: 1, price: 120000 },
    ],
    total: 270000,
  },
];
*/

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

/*
export const defaultCustomersMock: CustomerRecord[] = [
  {
    id: 'CUS-01',
    name: 'Nguyễn Văn A',
    email: 'vana@gmail.com',
    phone: '0901234567',
    accountType: 'member',
    district: 'Quận 1',
    noShowCount: 0,
  },
  {
    id: 'CUS-02',
    name: 'Trần Thị B',
    email: 'thib@gmail.com',
    phone: '0909234567',
    accountType: 'guest',
    district: 'Bình Thạnh',
    noShowCount: 1,
  },
  {
    id: 'CUS-03',
    name: 'Phạm Minh C',
    email: 'minhc@company.com',
    phone: '0936123456',
    accountType: 'member',
    district: 'Thủ Đức',
    noShowCount: 0,
  },
  {
    id: 'CUS-04',
    name: 'Lê Anh D',
    email: 'anhd@gmail.com',
    phone: '0918666888',
    accountType: 'member',
    district: 'Quận 7',
    noShowCount: 0,
  },
  {
    id: 'CUS-05',
    name: 'Hoàng Gia H',
    email: 'giah@gmail.com',
    phone: '0978123000',
    accountType: 'guest',
    district: 'Phú Nhuận',
    noShowCount: 2,
  },
  {
    id: 'CUS-06',
    name: 'Đặng Thu K',
    email: 'thuk@gmail.com',
    phone: '0988111000',
    accountType: 'member',
    district: 'Quận 3',
    noShowCount: 0,
  },
];
*/

export const defaultOrders: Order[] = [];

/*
const NOW = new Date().toISOString();

export const defaultOrdersMock: Order[] = [
  {
    id: 'EC-240401',
    code: 'EC240401',
    customerId: 'CUS-01',
    status: 'delivering',
    items: [{ name: 'Sofa đơn', quantity: 1, price: 150000 }, { name: 'Tủ quần áo', quantity: 1, price: 260000 }],
    schedule: { date: '2026-04-06', timeSlot: '08:00 - 10:00' },
    pricing: { subtotal: 410000, handlingFee: 0, total: 410000, hasQuoteItems: false },
    finalAmount: 410000,
    notes: '',
    attachments: { imageFileName: null, imageFileSize: null, imageFileType: null },
    itemSummary: 'Sofa đơn + Tủ quần áo',
    paymentMethod: 'online',
    assignedStaff: 'Huy / Xe 01',
    selfAssessment: 'Đồ cồng kềnh, cần 2 nhân viên và xe tải nhỏ.',
    priceAdjustment: 'Giữ nguyên giá',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'EC-240402',
    code: 'EC240402',
    customerId: 'CUS-02',
    status: 'processing',
    items: [{ name: 'Phế thải xây dựng', quantity: 45, price: 7000 }],
    schedule: { date: '2026-04-06', timeSlot: '10:00 - 12:00' },
    pricing: { subtotal: 315000, handlingFee: 0, total: 315000, hasQuoteItems: false },
    finalAmount: 315000,
    notes: '',
    attachments: { imageFileName: null, imageFileSize: null, imageFileType: null },
    itemSummary: 'Phế thải xây dựng 45kg',
    paymentMethod: 'cash',
    assignedStaff: 'Chưa phân công',
    selfAssessment: 'Cần kiểm tra khối lượng thực tế và ảnh hiện trường.',
    priceAdjustment: 'Có thể điều chỉnh theo kg thực tế',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'EC-240403',
    code: 'EC240403',
    customerId: 'CUS-03',
    status: 'delivering',
    items: [{ name: 'Tủ lạnh', quantity: 1, price: 200000 }, { name: 'Máy giặt', quantity: 1, price: 180000 }],
    schedule: { date: '2026-04-07', timeSlot: '14:00 - 16:00' },
    pricing: { subtotal: 380000, handlingFee: 0, total: 380000, hasQuoteItems: false },
    finalAmount: 380000,
    notes: '',
    attachments: { imageFileName: null, imageFileSize: null, imageFileType: null },
    itemSummary: 'Tủ lạnh + Máy giặt',
    paymentMethod: 'online',
    assignedStaff: 'Nam / Xe 03',
    selfAssessment: 'Đồ nặng, cần xe có sàn nâng.',
    priceAdjustment: 'Giữ nguyên giá',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'EC-240404',
    code: 'EC240404',
    customerId: 'CUS-04',
    status: 'completed',
    items: [{ name: 'Rác sinh hoạt đóng bao', quantity: 4, price: 60000 }],
    schedule: { date: '2026-04-05', timeSlot: '16:00 - 18:00' },
    pricing: { subtotal: 240000, handlingFee: -30000, total: 210000, hasQuoteItems: false },
    finalAmount: 240000,
    notes: '',
    attachments: { imageFileName: null, imageFileSize: null, imageFileType: null },
    itemSummary: 'Rác sinh hoạt đóng bao x4',
    paymentMethod: 'cash',
    assignedStaff: 'Tài / Xe 02',
    selfAssessment: 'Khách đã để sẵn đồ bên ngoài.',
    priceAdjustment: 'Giảm 30.000đ vì khách tự mang ra ngoài',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'EC-240405',
    code: 'EC240405',
    customerId: 'CUS-05',
    status: 'no_show',
    items: [{ name: 'Hạng mục khác: xe máy điện', quantity: 1, price: 0 }],
    schedule: { date: '2026-04-05', timeSlot: '12:00 - 14:00' },
    pricing: { subtotal: 0, handlingFee: 0, total: 0, hasQuoteItems: true },
    finalAmount: 0,
    notes: '',
    attachments: { imageFileName: null, imageFileSize: null, imageFileType: null },
    itemSummary: 'Hạng mục khác: xe máy điện',
    paymentMethod: 'cash',
    assignedStaff: 'Kiệt / Xe 05',
    selfAssessment: 'Hạng mục ngoài danh sách, cần báo giá thủ công.',
    priceAdjustment: 'Chưa chốt giá vì khách không có mặt',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'EC-240406',
    code: 'EC240406',
    customerId: 'CUS-06',
    status: 'processing',
    items: [{ name: 'Tivi', quantity: 1, price: 80000 }, { name: 'Bàn ghế văn phòng', quantity: 1, price: 100000 }],
    schedule: { date: '2026-04-08', timeSlot: '08:00 - 10:00' },
    pricing: { subtotal: 180000, handlingFee: 0, total: 180000, hasQuoteItems: false },
    finalAmount: 180000,
    notes: '',
    attachments: { imageFileName: null, imageFileSize: null, imageFileType: null },
    itemSummary: 'Tivi + Bàn ghế văn phòng',
    paymentMethod: 'online',
    assignedStaff: 'Hùng / Xe 04',
    selfAssessment: 'Cần tách riêng thiết bị điện tử để xử lý.',
    priceAdjustment: 'Giữ nguyên giá',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'EC-240407',
    code: 'EC240407',
    customerId: 'CUS-01',
    status: 'processing',
    items: [{ name: 'Giường / nệm', quantity: 1, price: 220000 }],
    schedule: { date: '2026-04-10', timeSlot: '10:00 - 12:00' },
    pricing: { subtotal: 220000, handlingFee: 0, total: 220000, hasQuoteItems: false },
    finalAmount: 220000,
    notes: '',
    attachments: { imageFileName: null, imageFileSize: null, imageFileType: null },
    itemSummary: 'Giường / nệm',
    paymentMethod: 'online',
    assignedStaff: 'Chưa phân công',
    selfAssessment: 'Nệm cồng kềnh, cần xác nhận thang máy.',
    priceAdjustment: 'Có thể cộng phí vác thang bộ',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'EC-240408',
    code: 'EC240408',
    customerId: 'CUS-03',
    status: 'cancelled',
    items: [{ name: 'Hạng mục khác: biển quảng cáo', quantity: 1, price: 0 }],
    schedule: { date: '2026-04-09', timeSlot: '18:00 - 20:00' },
    pricing: { subtotal: 0, handlingFee: 0, total: 0, hasQuoteItems: true },
    finalAmount: 0,
    notes: '',
    attachments: { imageFileName: null, imageFileSize: null, imageFileType: null },
    itemSummary: 'Hạng mục khác: biển quảng cáo',
    paymentMethod: 'cash',
    assignedStaff: 'Chưa phân công',
    selfAssessment: 'Biển quảng cáo cần khảo sát thực tế trước khi nhận.',
    priceAdjustment: 'Chưa chốt giá',
    createdAt: NOW,
    updatedAt: NOW,
  },
];
*/

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
