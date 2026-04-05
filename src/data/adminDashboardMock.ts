export type OrderStatus = 'processing' | 'delivering' | 'completed' | 'cancelled' | 'no_show';

export interface CustomerRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  accountType: 'guest' | 'member';
  district: string;
  noShowCount: number;
}

export interface OrderRecord {
  id: string;
  code: string;
  customerId: string;
  itemSummary: string;
  bookingDate: string;
  slot: string;
  amount: number;
  status: OrderStatus;
  paymentMethod: 'cash' | 'online';
  assignedStaff: string;
  selfAssessment: string;
  priceAdjustment: string;
}

export interface ServicePriceRecord {
  id: string;
  name: string;
  unitLabel: string;
  category: string;
  price: number;
  note: string;
}

export const customers: CustomerRecord[] = [
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

export const initialOrders: OrderRecord[] = [
  {
    id: 'ORD-01',
    code: 'EC240401',
    customerId: 'CUS-01',
    itemSummary: 'Sofa đơn + Tủ quần áo',
    bookingDate: '2026-04-06',
    slot: '08:00 - 10:00',
    amount: 410000,
    status: 'delivering',
    paymentMethod: 'online',
    assignedStaff: 'Huy / Xe 01',
    selfAssessment: 'Đồ cồng kềnh, cần 2 nhân viên và xe tải nhỏ.',
    priceAdjustment: 'Giữ nguyên giá',
  },
  {
    id: 'ORD-02',
    code: 'EC240402',
    customerId: 'CUS-02',
    itemSummary: 'Phế thải xây dựng 45kg',
    bookingDate: '2026-04-06',
    slot: '10:00 - 12:00',
    amount: 315000,
    status: 'processing',
    paymentMethod: 'cash',
    assignedStaff: 'Chưa phân công',
    selfAssessment: 'Cần kiểm tra khối lượng thực tế và ảnh hiện trường.',
    priceAdjustment: 'Có thể điều chỉnh theo kg thực tế',
  },
  {
    id: 'ORD-03',
    code: 'EC240403',
    customerId: 'CUS-03',
    itemSummary: 'Tủ lạnh + Máy giặt',
    bookingDate: '2026-04-07',
    slot: '14:00 - 16:00',
    amount: 380000,
    status: 'delivering',
    paymentMethod: 'online',
    assignedStaff: 'Nam / Xe 03',
    selfAssessment: 'Đồ nặng, cần xe có sàn nâng.',
    priceAdjustment: 'Giữ nguyên giá',
  },
  {
    id: 'ORD-04',
    code: 'EC240404',
    customerId: 'CUS-04',
    itemSummary: 'Rác sinh hoạt đóng bao x4',
    bookingDate: '2026-04-05',
    slot: '16:00 - 18:00',
    amount: 240000,
    status: 'completed',
    paymentMethod: 'cash',
    assignedStaff: 'Tài / Xe 02',
    selfAssessment: 'Khách đã để sẵn đồ bên ngoài.',
    priceAdjustment: 'Giảm 30.000đ vì khách tự mang ra ngoài',
  },
  {
    id: 'ORD-05',
    code: 'EC240405',
    customerId: 'CUS-05',
    itemSummary: 'Hạng mục khác: xe máy điện',
    bookingDate: '2026-04-05',
    slot: '12:00 - 14:00',
    amount: 0,
    status: 'no_show',
    paymentMethod: 'cash',
    assignedStaff: 'Kiệt / Xe 05',
    selfAssessment: 'Hạng mục ngoài danh sách, cần báo giá thủ công.',
    priceAdjustment: 'Chưa chốt giá vì khách không có mặt',
  },
  {
    id: 'ORD-06',
    code: 'EC240406',
    customerId: 'CUS-06',
    itemSummary: 'Tivi + Bàn ghế văn phòng',
    bookingDate: '2026-04-08',
    slot: '08:00 - 10:00',
    amount: 180000,
    status: 'processing',
    paymentMethod: 'online',
    assignedStaff: 'Hùng / Xe 04',
    selfAssessment: 'Cần tách riêng thiết bị điện tử để xử lý.',
    priceAdjustment: 'Giữ nguyên giá',
  },
  {
    id: 'ORD-07',
    code: 'EC240407',
    customerId: 'CUS-01',
    itemSummary: 'Giường / nệm',
    bookingDate: '2026-04-10',
    slot: '10:00 - 12:00',
    amount: 220000,
    status: 'processing',
    paymentMethod: 'online',
    assignedStaff: 'Chưa phân công',
    selfAssessment: 'Nệm cồng kềnh, cần xác nhận thang máy.',
    priceAdjustment: 'Có thể cộng phí vác thang bộ',
  },
  {
    id: 'ORD-08',
    code: 'EC240408',
    customerId: 'CUS-03',
    itemSummary: 'Hạng mục khác: biển quảng cáo',
    bookingDate: '2026-04-09',
    slot: '18:00 - 20:00',
    amount: 0,
    status: 'cancelled',
    paymentMethod: 'cash',
    assignedStaff: 'Chưa phân công',
    selfAssessment: 'Biển quảng cáo cần khảo sát thực tế trước khi nhận.',
    priceAdjustment: 'Chưa chốt giá',
  },
];

export const initialServicePricing: ServicePriceRecord[] = [
  {
    id: 'SER-01',
    name: 'Sofa đơn',
    unitLabel: '/món',
    category: 'Nội thất',
    price: 150000,
    note: 'Giá chuẩn cho món đơn, không có phụ phí đặc biệt.',
  },
  {
    id: 'SER-02',
    name: 'Tủ quần áo khổ lớn',
    unitLabel: '/món',
    category: 'Nội thất',
    price: 420000,
    note: 'Có thể cộng thêm nếu khách cần vác thang bộ.',
  },
  {
    id: 'SER-03',
    name: 'Phế thải xây dựng',
    unitLabel: '/kg',
    category: 'Khác',
    price: 7000,
    note: 'Admin kiểm tra lại theo khối lượng thực tế tại hiện trường.',
  },
  {
    id: 'SER-04',
    name: 'Rác sinh hoạt đóng bao',
    unitLabel: '/bao',
    category: 'Khác',
    price: 60000,
    note: 'Giá áp dụng với bao đã đóng kín và dễ bốc xếp.',
  },
];

export const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

export const statusMeta: Record<OrderStatus, { label: string; tone: string }> = {
  processing: {
    label: 'Đang xử lý',
    tone: 'bg-amber-100 text-amber-700',
  },
  delivering: {
    label: 'Đang giao hàng',
    tone: 'bg-sky-100 text-sky-700',
  },
  completed: {
    label: 'Đã hoàn thành',
    tone: 'bg-teal-100 text-teal-700',
  },
  cancelled: {
    label: 'Đã hủy',
    tone: 'bg-slate-200 text-slate-700',
  },
  no_show: {
    label: 'Không có mặt',
    tone: 'bg-rose-100 text-rose-700',
  },
};

export const statusFilters: Array<{ id: 'all' | OrderStatus; label: string }> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'processing', label: 'Đang xử lý' },
  { id: 'delivering', label: 'Đang giao hàng' },
  { id: 'completed', label: 'Đã hoàn thành' },
  { id: 'no_show', label: 'Không có mặt' },
];

export function getCustomerFacingStatus(status: OrderStatus) {
  if (status === 'completed') {
    return { label: 'Đã hoàn thành', tone: 'bg-teal-100 text-teal-700' };
  }

  if (status === 'cancelled') {
    return { label: 'Đã hủy', tone: 'bg-slate-200 text-slate-700' };
  }

  if (status === 'no_show') {
    return { label: 'Không hoàn thành', tone: 'bg-rose-100 text-rose-700' };
  }

  return { label: 'Đang xử lý', tone: 'bg-amber-100 text-amber-700' };
}
