/**
 * adminDashboardMock.ts — giờ chỉ là re-export từ shared store.
 * Giữ nguyên để không breaking existing imports.
 */
export type {
  OrderStatus,
  Order as OrderRecord,
  CustomerRecord,
  ServicePriceRecord,
} from '../lib/store';

export {
  defaultOrders as initialOrders,
  defaultCustomers as customers,
  defaultPricing as initialServicePricing,
  currency,
  statusMeta,
  statusFilters,
  getCustomerFacingStatus,
  readOrders,
  writeOrders,
  updateOrderStatus,
  readCustomers,
  writeCustomers,
  readPricing,
  writePricing,
} from '../lib/store';
