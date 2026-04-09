/**
 * src/types/api.ts
 * ─────────────────────────────────────────────────
 * Toàn bộ TypeScript types khớp chính xác với JSON
 * response của Backend (theo API_Specs.md).
 *
 * QUY TẮC:
 *  - Types này là "single source of truth" cho tầng API.
 *  - Không tự suy diễn logic ở FE — đọc từ BE response.
 *  - Chỉ chỉnh sửa khi Backend thay đổi contract.
 * ─────────────────────────────────────────────────
 */

// ─── Wrapper chuẩn cho mọi response ──────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
  error_code: string | null;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export type UserRole = 'customer' | 'admin';

export interface ApiUser {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  address?: string;
  city?: string;
  district?: string;
  role: UserRole;
  /** Cờ từ BE: bắt thanh toán online do bùng quá nhiều */
  prepaid_required: boolean;
  is_blacklisted: boolean;
  no_show_count: number;
  status: 'active' | 'inactive' | 'locked';
  created_at: string;
  updated_at: string;
}

export interface AuthPayload {
  access_token: string;
  user: ApiUser;
}

export interface LoginBody {
  /** identity = phone hoặc email */
  identity: string;
  password: string;
}

export interface RegisterBody {
  full_name: string;
  phone: string;
  email: string;
  password: string;
}

// ─── Services & Variants ─────────────────────────────────────────────────────

export interface ServiceVariant {
  id: string;
  service_id: string;
  label: string;
  price: number;
  unit: string;
  active: boolean;
}

export interface ApiService {
  id: string;
  code: string;
  name: string;
  category: string;
  pricing_type: 'fixed' | 'per_kg' | 'per_unit' | 'quote';
  base_price: number;
  default_unit: string;
  active: boolean;
  variants: ServiceVariant[];
}

// ─── Time Slots ───────────────────────────────────────────────────────────────

export interface TimeSlot {
  id: string;
  start_time: string; // HH:mm
  end_time: string;   // HH:mm
  max_orders: number;
  active: boolean;
  /** Chỉ có khi gọi kèm ?date= */
  is_full?: boolean;
}

// ─── Pricing / Quote ─────────────────────────────────────────────────────────

export type HandlingMode = 'inside' | 'outside' | 'stairs';

export interface QuoteItem {
  service_id: string;
  variant_id?: string;
  quantity: number;
  measurement_value?: number;
  /** Tên mục do khách tự nhập (hàng mục khác) */
  custom_item_name?: string;
}

export interface QuoteBody {
  items: QuoteItem[];
  handling_mode: HandlingMode;
  stairs_floors?: number;
  voucher_code?: string;
}

export interface QuoteResult {
  service_subtotal: number;
  handling_fee: number;
  discount_amount: number;
  estimated_total: number;
  /** true → FE không hiện giá, hiển thị "Cần báo giá thủ công" */
  manual_quote_required: boolean;
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'draft'
  | 'pending'
  | 'confirmed'
  | 'delivering'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type PaymentMethod = 'online' | 'cash';

export interface OrderCustomer {
  name: string;
  phone: string;
  email: string;
}

export interface OrderAddress {
  street: string;
  ward: string;
  district: string;
  province: string;
}

export interface OrderItem {
  id: string;
  /** Snapshot name lúc tạo đơn (không join bảng services) */
  service_name: string;
  variant_label?: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  custom_item_name?: string;
}

export interface StatusTimeline {
  status: OrderStatus;
  created_at: string;
  note?: string;
}

export interface Order {
  id: string;
  code: string;
  status: OrderStatus;
  customer: OrderCustomer;
  address: OrderAddress;
  booking_date: string;       // YYYY-MM-DD
  time_slot_id: string;
  time_slot_label?: string;   // "08:00 - 10:00"
  items: OrderItem[];
  handling_mode: HandlingMode;
  stairs_floors?: number;
  voucher_code?: string;
  service_subtotal: number;
  handling_fee: number;
  discount_amount: number;
  estimated_total: number;
  final_total: number | null;
  payment_method: PaymentMethod;
  cash_policy_accepted: boolean;
  /** Admin-only */
  internal_notes?: string;
  assigned_staff?: string;
  adjustment_reason?: string;
  manual_quote_required: boolean;
  timeline: StatusTimeline[];
  created_at: string;
  updated_at: string;
}

export interface CreateOrderBody {
  customer: OrderCustomer;
  address: OrderAddress;
  booking_date: string;
  time_slot_id: string;
  items: QuoteItem[];
  handling_mode: HandlingMode;
  stairs_floors?: number;
  voucher_code?: string;
  payment_method: PaymentMethod;
  cash_policy_accepted: boolean;
}

// ─── Payment ─────────────────────────────────────────────────────────────────

export interface PaymentIntent {
  order_id: string;
  payment_url: string;
  expire_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  order_code: string;
  method: PaymentMethod;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  amount: number;
  provider_ref?: string;
  created_at: string;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export interface UnreadCount {
  count: number;
}

// ─── Vouchers ────────────────────────────────────────────────────────────────

export type VoucherType = 'percent' | 'fixed';

export interface Voucher {
  id: string;
  code: string;
  type: VoucherType;
  value: number;
  max_discount?: number;
  min_order_value: number;
  usage_limit: number;
  used_count: number;
  start_date: string;
  end_date: string;
  active: boolean;
}

export interface CreateVoucherBody {
  code: string;
  type: VoucherType;
  value: number;
  max_discount?: number;
  min_order_value: number;
  usage_limit: number;
  start_date: string;
  end_date: string;
}

// ─── Admin – Metrics ─────────────────────────────────────────────────────────

export interface OrdersByStatus {
  status: OrderStatus;
  count: number;
}

export interface RevenuePoint {
  date: string; // YYYY-MM-DD
  revenue: number;
}

export interface TopService {
  service_name: string;
  order_count: number;
  revenue: number;
}

export interface AdminMetrics {
  total_orders: number;
  today_orders: number;
  total_revenue: number;
  completion_rate: number;
  orders_by_status: OrdersByStatus[];
  revenue_chart: RevenuePoint[];
  top_services: TopService[];
}

// ─── Pagination wrapper ───────────────────────────────────────────────────────

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
