import type {
  ApiService,
  ApiUser,
  AdminMetrics,
  Order as ApiOrder,
  OrderStatus as ApiOrderStatus,
} from '@/shared/types/api';
import type {
  CustomerRecord,
  Order as StoreOrder,
  OrderStatus as StoreOrderStatus,
  ServicePriceRecord,
} from '@/shared/lib/store';

export function getPaginatedItems<T>(
  value: { items?: T[] } | T[] | null | undefined,
): T[] {
  if (Array.isArray(value)) {
    return value;
  }

  return Array.isArray(value?.items) ? value.items : [];
}

const API_TO_STORE_STATUS: Record<ApiOrderStatus, StoreOrderStatus> = {
  draft: 'processing',
  pending: 'processing',
  confirmed: 'delivering',
  delivering: 'delivering',
  completed: 'completed',
  cancelled: 'cancelled',
  no_show: 'no_show',
};

export function mapApiOrderStatus(status: ApiOrderStatus): StoreOrderStatus {
  return API_TO_STORE_STATUS[status] ?? 'processing';
}

export function mapStoreOrderStatusToApiStatus(
  status: StoreOrderStatus,
): ApiOrderStatus {
  if (status === 'processing') return 'pending';
  if (status === 'delivering') return 'confirmed';
  return status;
}

export function mapApiUserToCustomerRecord(user: ApiUser): CustomerRecord {
  return {
    id: user.id,
    name: user.full_name || user.email || user.phone || 'Unknown customer',
    email: user.email ?? '',
    phone: user.phone ?? '',
    accountType: 'member',
    district: user.district ?? user.city ?? '',
    noShowCount: user.no_show_count ?? 0,
  };
}

export function mapApiOrderToCustomerRecord(order: ApiOrder): CustomerRecord {
  const customerId =
    order.customer.email || order.customer.phone || order.customer.name || order.id;

  return {
    id: customerId,
    name: order.customer.name || 'Unknown customer',
    email: order.customer.email ?? '',
    phone: order.customer.phone ?? '',
    accountType: order.customer.email ? 'member' : 'guest',
    district: order.address.district ?? '',
    noShowCount: 0,
  };
}

export function mergeCustomerRecords(
  current: CustomerRecord[],
  incoming: CustomerRecord[],
): CustomerRecord[] {
  const byKey = new Map<string, CustomerRecord>();

  const keysFor = (customer: CustomerRecord) => [
    customer.id,
    customer.email,
    customer.phone,
  ].filter(Boolean);

  current.forEach((customer) => {
    byKey.set(customer.id, customer);
  });

  incoming.forEach((customer) => {
    const existingKey = keysFor(customer).find((key) => byKey.has(key));
    const existing = existingKey ? byKey.get(existingKey) : undefined;
    const next = existing ? { ...existing, ...customer } : customer;

    keysFor(next).forEach((key) => byKey.set(key, next));
  });

  return Array.from(
    new Map(Array.from(byKey.values()).map((customer) => [customer.id, customer]))
      .values(),
  );
}

export function findCustomerForOrder(
  order: StoreOrder,
  customers: CustomerRecord[],
): CustomerRecord | undefined {
  return customers.find(
    (customer) =>
      customer.id === order.customerId ||
      customer.email === order.customerId ||
      customer.phone === order.customerId,
  );
}

export function mapApiOrderToStoreOrder(order: ApiOrder): StoreOrder {
  const finalAmount = order.final_total ?? order.estimated_total ?? 0;
  const itemSummary = order.items
    .map((item) => item.custom_item_name || item.service_name)
    .filter(Boolean)
    .join(' + ');

  return {
    id: order.id,
    code: order.code,
    customerId: order.customer.email || order.customer.phone || order.customer.name || order.id,
    status: mapApiOrderStatus(order.status),
    items: order.items.map((item) => ({
      name: item.custom_item_name || item.service_name || item.variant_label || 'Item',
      quantity: item.quantity,
      price: item.line_total ?? item.unit_price * item.quantity,
    })),
    schedule: {
      date: order.booking_date,
      timeSlot: order.time_slot_label ?? order.time_slot_id,
    },
    pricing: {
      subtotal: order.service_subtotal,
      handlingFee: order.handling_fee - order.discount_amount,
      total: order.estimated_total,
      hasQuoteItems: order.manual_quote_required,
    },
    finalAmount,
    notes: order.internal_notes ?? '',
    attachments: {
      imageFileName: null,
      imageFileSize: null,
      imageFileType: null,
    },
    itemSummary: itemSummary || order.code,
    paymentMethod: order.payment_method,
    assignedStaff: order.assigned_staff ?? 'Chưa phân công',
    selfAssessment: order.manual_quote_required
      ? 'Cần báo giá thủ công.'
      : 'Đọc từ backend.',
    priceAdjustment: order.adjustment_reason ?? 'Giữ nguyên giá',
    createdAt: order.created_at,
    updatedAt: order.updated_at,
  };
}

function toUnitLabel(unit: string): string {
  if (!unit) return '';
  return unit.startsWith('/') ? unit : `/${unit}`;
}

export function mapApiServiceToServicePriceRecord(
  service: ApiService,
): ServicePriceRecord {
  return {
    id: service.id,
    name: service.name,
    unitLabel: toUnitLabel(service.default_unit),
    category: service.category,
    price: service.base_price,
    note: service.active ? `Code: ${service.code}` : `Code: ${service.code} - inactive`,
  };
}

export function getMetricValue(
  metrics: AdminMetrics | null,
  key: keyof AdminMetrics,
  fallback: number,
): number {
  const value = metrics?.[key];
  return typeof value === 'number' ? value : fallback;
}
