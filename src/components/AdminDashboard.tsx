'use client';

import Link from 'next/link';
import { useDeferredValue, useState } from 'react';
import { adminAccounts } from '../data/adminMock';
import { cn } from '../utils/cn';

type OrderStatus = 'processing' | 'delivering' | 'completed' | 'cancelled' | 'no_show';

interface CustomerRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  accountType: 'guest' | 'member';
  district: string;
  noShowCount: number;
}

interface OrderRecord {
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

interface ServicePriceRecord {
  id: string;
  name: string;
  unitLabel: string;
  category: string;
  price: number;
  note: string;
}

const customers: CustomerRecord[] = [
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

const initialOrders: OrderRecord[] = [
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

const initialServicePricing: ServicePriceRecord[] = [
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

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const statusMeta: Record<OrderStatus, { label: string; tone: string }> = {
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

const statusFilters: Array<{ id: 'all' | OrderStatus; label: string }> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'processing', label: 'Đang xử lý' },
  { id: 'delivering', label: 'Đang giao hàng' },
  { id: 'completed', label: 'Đã hoàn thành' },
  { id: 'no_show', label: 'Không có mặt' },
];

function getCustomerFacingStatus(status: OrderStatus) {
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

export default function AdminDashboard() {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [orders, setOrders] = useState<OrderRecord[]>(initialOrders);
  const [servicePricing, setServicePricing] = useState<ServicePriceRecord[]>(initialServicePricing);
  const deferredQuery = useDeferredValue(query);

  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const updateOrderStatus = (orderId: string, nextStatus: OrderStatus) => {
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: nextStatus,
            }
          : order
      )
    );
  };

  const adjustServicePrice = (serviceId: string, delta: number) => {
    setServicePricing((currentServices) =>
      currentServices.map((service) =>
        service.id === serviceId
          ? {
              ...service,
              price: Math.max(0, service.price + delta),
            }
          : service
      )
    );
  };

  const getAdminAction = (order: OrderRecord) => {
    if (order.status === 'processing') {
      return {
        label: 'Xác nhận đơn',
        helper: 'Admin xác nhận để chuyển đơn từ đang xử lý sang đang giao hàng.',
        onClick: () => updateOrderStatus(order.id, 'delivering'),
        className: 'bg-[#103B2D] text-white hover:-translate-y-0.5',
      };
    }

    if (order.status === 'delivering') {
      return {
        label: 'Hoàn thành đơn',
        helper: 'Chốt đơn sau khi giao / thu gom xong để cập nhật trạng thái cuối.',
        onClick: () => updateOrderStatus(order.id, 'completed'),
        className: 'bg-[#2F855A] text-white hover:-translate-y-0.5',
      };
    }

    if (order.status === 'no_show') {
      return {
        label: 'Xác nhận no-show',
        helper: 'Ghi nhận thất bại để lưu lịch sử cảnh báo cho khách hàng này.',
        onClick: () => updateOrderStatus(order.id, 'cancelled'),
        className: 'bg-[#7A2E2E] text-white hover:-translate-y-0.5',
      };
    }

    return null;
  };

  const customerRows = customers
    .map((customer) => {
      const customerOrders = orders.filter((order) => order.customerId === customer.id);
      const latestOrder = [...customerOrders].sort((a, b) => b.bookingDate.localeCompare(a.bookingDate))[0];
      const totalSpent = customerOrders.reduce((sum, order) => sum + order.amount, 0);

      return {
        ...customer,
        latestOrder,
        ordersCount: customerOrders.length,
        totalSpent,
      };
    })
    .filter((customer) => {
      const matchesQuery =
        normalizedQuery === '' ||
        customer.name.toLowerCase().includes(normalizedQuery) ||
        customer.email.toLowerCase().includes(normalizedQuery) ||
        customer.phone.includes(normalizedQuery);

      const matchesStatus = statusFilter === 'all' || customer.latestOrder?.status === statusFilter;

      return matchesQuery && matchesStatus;
    });

  const statusSummary = Object.entries(statusMeta).map(([status, meta]) => ({
    id: status as OrderStatus,
    label: meta.label,
    count: orders.filter((order) => order.status === status).length,
    tone: meta.tone,
  }));

  const totalRevenue = orders.reduce((sum, order) => sum + order.amount, 0);
  const memberCount = customers.filter((customer) => customer.accountType === 'member').length;
  const guestCount = customers.length - memberCount;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#EEF8F0_0%,_#F9FCFA_35%,_#FFFFFF_100%)] text-[#103B2D]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-[#D7ECDD] bg-[linear-gradient(135deg,_#103B2D_0%,_#18543F_100%)] p-6 text-white shadow-[0_28px_80px_rgba(16,59,45,0.18)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#A7E8B6]">
                Trang quản trị EcoCollect
              </p>
              <h1 className="mt-3 text-4xl font-bold">Quản lý người dùng và tình trạng đơn hàng</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/78">
                Dashboard mock này mô phỏng đúng luồng quản trị: theo dõi user, cập nhật giá dịch vụ,
                xác nhận đơn và chốt hoàn thành đơn hàng.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/"
                className="rounded-full border border-white/14 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/14"
              >
                Về trang chủ
              </Link>
              <span className="rounded-full bg-[#E6FFEE] px-5 py-3 text-sm font-semibold text-[#103B2D]">
                Chỉ dùng mock data
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Tổng khách hàng', value: customers.length, note: `${memberCount} thành viên / ${guestCount} khách vãng lai` },
            { label: 'Tổng đơn hàng', value: orders.length, note: `${orders.filter((order) => order.status === 'completed').length} đơn đã hoàn thành` },
            { label: 'Chờ admin xử lý', value: orders.filter((order) => ['processing', 'delivering'].includes(order.status)).length, note: 'Đơn cần xác nhận hoặc chốt hoàn thành' },
            { label: 'Doanh thu mock', value: currency.format(totalRevenue), note: `${orders.filter((order) => order.status === 'no_show').length} đơn không có mặt` },
          ].map((card) => (
            <section
              key={card.label}
              className="rounded-[28px] border border-[#D7ECDD] bg-white p-5 shadow-[0_18px_45px_rgba(16,59,45,0.06)]"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2F855A]">{card.label}</p>
              <div className="mt-3 text-3xl font-bold text-[#103B2D]">{card.value}</div>
              <p className="mt-2 text-sm text-[#5D776A]">{card.note}</p>
            </section>
          ))}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-[32px] border border-[#D7ECDD] bg-white p-5 shadow-[0_18px_45px_rgba(16,59,45,0.06)]">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#2F855A]">Thanh quản trị</p>
              <div className="mt-5 space-y-3">
                {[
                  {
                    href: '#user-management',
                    title: 'Quản lý user',
                    description: 'Xem khách hàng, loại tài khoản, đơn gần nhất và trạng thái hiển thị cho khách.',
                  },
                  {
                    href: '#pricing-management',
                    title: 'Cập nhật giá dịch vụ',
                    description: 'Tăng giảm giá mock cho từng hạng mục để demo nghiệp vụ điều chỉnh bảng giá.',
                  },
                  {
                    href: '#order-review',
                    title: 'Kiểm tra đơn hàng',
                    description: 'Xác nhận đơn, chuyển sang đang giao hàng và hoàn thành đơn trực tiếp trên dashboard.',
                  },
                ].map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="block rounded-[24px] border border-[#D7ECDD] bg-[#F9FCFA] p-4 transition-colors hover:border-[#2F855A] hover:bg-[#F3FBF5]"
                  >
                    <p className="font-semibold text-[#103B2D]">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-[#5D776A]">{item.description}</p>
                  </a>
                ))}
              </div>

              <div className="mt-5 rounded-[24px] bg-[#103B2D] p-4 text-sm leading-6 text-white/78">
                Admin xử lý theo đúng nghiệp vụ đã chốt: khách mới đặt đơn là đang xử lý, admin xác nhận
                thì chuyển sang đang giao hàng, giao xong thì đánh dấu đã hoàn thành.
              </div>
            </div>
          </aside>

          <div className="space-y-8">
            <section className="rounded-[32px] border border-[#D7ECDD] bg-white p-6 shadow-[0_18px_45px_rgba(16,59,45,0.06)]">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#2F855A]">Tài khoản admin demo</p>
                  <h2 className="mt-2 text-2xl font-bold">Mock data tài khoản quản trị để test UI</h2>
                </div>
                <div className="rounded-full bg-[#F3FBF5] px-4 py-2 text-sm text-[#476458]">
                  Gợi ý: dùng các tài khoản này để demo phần role / quyền hạn
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                {adminAccounts.map((admin) => (
                  <article key={admin.id} className="rounded-[28px] border border-[#D7ECDD] bg-[#F9FCFA] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2F855A]">{admin.id}</p>
                        <h3 className="mt-2 text-xl font-bold text-[#103B2D]">{admin.name}</h3>
                        <p className="mt-1 text-sm text-[#476458]">{admin.role}</p>
                      </div>
                      <span className="rounded-full bg-[#103B2D] px-3 py-1 text-xs font-semibold text-white">
                        {admin.shift}
                      </span>
                    </div>

                    <div className="mt-5 rounded-[22px] bg-white p-4 text-sm text-[#476458]">
                      <p><span className="font-semibold text-[#103B2D]">Email:</span> {admin.email}</p>
                      <p className="mt-2"><span className="font-semibold text-[#103B2D]">Mật khẩu:</span> {admin.password}</p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {admin.permissions.map((permission) => (
                        <span
                          key={permission}
                          className="rounded-full bg-[#EAF8EE] px-3 py-2 text-xs font-semibold text-[#2F855A]"
                        >
                          {permission}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section id="user-management" className="rounded-[32px] border border-[#D7ECDD] bg-white p-6 shadow-[0_18px_45px_rgba(16,59,45,0.06)]">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#2F855A]">Quản lý user</p>
                  <h2 className="mt-2 text-2xl font-bold">Quản lý người dùng và đơn hàng gần nhất</h2>
                </div>
                <div className="text-sm text-[#5D776A]">
                  Đang hiển thị <span className="font-semibold text-[#103B2D]">{customerRows.length}</span> user
                </div>
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-3">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-[0.16em] text-[#6E877C]">
                      <th className="px-4">Khách hàng</th>
                      <th className="px-4">Loại tài khoản</th>
                      <th className="px-4">Đơn gần nhất</th>
                      <th className="px-4">Trạng thái admin</th>
                      <th className="px-4">Trạng thái khách thấy</th>
                      <th className="px-4">Tổng đơn</th>
                      <th className="px-4">Tổng chi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerRows.map((customer) => (
                      <tr key={customer.id} className="rounded-[24px] bg-[#F9FCFA] text-sm text-[#476458]">
                        <td className="rounded-l-[24px] px-4 py-4 align-top">
                          <p className="font-semibold text-[#103B2D]">{customer.name}</p>
                          <p className="mt-1">{customer.email}</p>
                          <p className="mt-1">{customer.phone}</p>
                          <p className="mt-2 text-xs text-[#6E877C]">
                            {customer.district} • no-show: {customer.noShowCount}
                          </p>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <span
                            className={cn(
                              'inline-flex rounded-full px-3 py-2 text-xs font-semibold',
                              customer.accountType === 'member'
                                ? 'bg-[#DDF6E4] text-[#2F855A]'
                                : 'bg-[#EEF1EF] text-[#5E7469]'
                            )}
                          >
                            {customer.accountType === 'member' ? 'Thành viên' : 'Khách vãng lai'}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-top">
                          {customer.latestOrder ? (
                            <>
                              <p className="font-semibold text-[#103B2D]">{customer.latestOrder.code}</p>
                              <p className="mt-1">{customer.latestOrder.itemSummary}</p>
                              <p className="mt-1 text-xs text-[#6E877C]">
                                {customer.latestOrder.bookingDate} • {customer.latestOrder.slot}
                              </p>
                            </>
                          ) : (
                            <span>Chưa có đơn</span>
                          )}
                        </td>
                        <td className="px-4 py-4 align-top">
                          {customer.latestOrder ? (
                            <span
                              className={cn(
                                'inline-flex rounded-full px-3 py-2 text-xs font-semibold',
                                statusMeta[customer.latestOrder.status].tone
                              )}
                            >
                              {statusMeta[customer.latestOrder.status].label}
                            </span>
                          ) : (
                            <span className="text-[#6E877C]">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4 align-top">
                          {customer.latestOrder ? (
                            <span
                              className={cn(
                                'inline-flex rounded-full px-3 py-2 text-xs font-semibold',
                                getCustomerFacingStatus(customer.latestOrder.status).tone
                              )}
                            >
                              {getCustomerFacingStatus(customer.latestOrder.status).label}
                            </span>
                          ) : (
                            <span className="text-[#6E877C]">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4 align-top font-semibold text-[#103B2D]">{customer.ordersCount}</td>
                        <td className="rounded-r-[24px] px-4 py-4 align-top font-semibold text-[#103B2D]">
                          {currency.format(customer.totalSpent)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section id="pricing-management" className="rounded-[32px] border border-[#D7ECDD] bg-white p-6 shadow-[0_18px_45px_rgba(16,59,45,0.06)]">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#2F855A]">Cập nhật giá cả dịch vụ</p>
                  <h2 className="mt-2 text-2xl font-bold">Bảng giá mock để admin điều chỉnh nhanh</h2>
                </div>
                <div className="rounded-full bg-[#F3FBF5] px-4 py-2 text-sm text-[#476458]">
                  Demo thao tác tăng / giảm giá trực tiếp trên dashboard
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
                {servicePricing.map((service) => (
                  <article key={service.id} className="rounded-[28px] border border-[#D7ECDD] bg-[#F9FCFA] p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2F855A]">
                      {service.category}
                    </p>
                    <h3 className="mt-2 text-xl font-bold text-[#103B2D]">{service.name}</h3>
                    <p className="mt-1 text-sm text-[#476458]">{service.note}</p>

                    <div className="mt-4 rounded-[22px] bg-white p-4">
                      <p className="text-sm text-[#5D776A]">Giá hiện tại</p>
                      <div className="mt-2 text-2xl font-bold text-[#103B2D]">
                        {currency.format(service.price)}
                        {service.unitLabel}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => adjustServicePrice(service.id, -10000)}
                        className="rounded-full border border-[#D7ECDD] bg-white px-4 py-3 text-sm font-semibold text-[#103B2D] transition-colors hover:bg-[#EEF6F0]"
                      >
                        Giảm 10.000đ
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustServicePrice(service.id, 10000)}
                        className="rounded-full bg-[#103B2D] px-4 py-3 text-sm font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5"
                      >
                        Tăng 10.000đ
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section id="order-review" className="rounded-[32px] border border-[#D7ECDD] bg-white p-6 shadow-[0_18px_45px_rgba(16,59,45,0.06)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#2F855A]">Kiểm tra đơn hàng</p>
                  <h2 className="mt-2 text-2xl font-bold">Tình trạng đơn hàng hiện tại</h2>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Tìm theo tên, email, số điện thoại..."
                    className="min-w-[280px] rounded-full border border-[#D7ECDD] bg-[#F9FCFA] px-4 py-3 text-sm outline-none transition-colors focus:border-[#2F855A]"
                  />
                  <div className="flex flex-wrap gap-2">
                    {statusFilters.map((filter) => (
                      <button
                        key={filter.id}
                        type="button"
                        onClick={() => setStatusFilter(filter.id)}
                        className={cn(
                          'rounded-full px-4 py-3 text-sm font-semibold transition-colors',
                          statusFilter === filter.id
                            ? 'bg-[#103B2D] text-white'
                            : 'bg-[#F3FBF5] text-[#476458] hover:bg-[#EAF8EE]'
                        )}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {statusSummary.map((status) => (
                  <div key={status.id} className="rounded-[24px] border border-[#D7ECDD] bg-[#F9FCFA] p-4">
                    <span className={cn('inline-flex rounded-full px-3 py-1 text-xs font-semibold', status.tone)}>
                      {status.label}
                    </span>
                    <div className="mt-4 text-3xl font-bold text-[#103B2D]">{status.count}</div>
                    <p className="mt-1 text-sm text-[#5D776A]">Đơn theo luồng xử lý của admin</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
                <section className="rounded-[28px] border border-[#D7ECDD] bg-[#FCFEFD] p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#2F855A]">Nghiệp vụ admin</p>
                  <div className="mt-5 space-y-3">
                    {orders
                      .filter((order) => ['processing', 'delivering', 'no_show'].includes(order.status))
                      .map((order) => {
                        const action = getAdminAction(order);

                        return (
                          <div key={order.id} className="rounded-[24px] bg-[#F9FCFA] p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-[#103B2D]">{order.code}</p>
                                <p className="mt-1 text-sm text-[#476458]">{order.itemSummary}</p>
                                <p className="mt-2 text-xs text-[#6E877C]">
                                  {order.bookingDate} • {order.slot}
                                </p>
                                <p className="mt-3 text-sm text-[#476458]">
                                  <span className="font-semibold text-[#103B2D]">Tự đánh giá đồ:</span> {order.selfAssessment}
                                </p>
                                <p className="mt-2 text-sm text-[#476458]">
                                  <span className="font-semibold text-[#103B2D]">Điều chỉnh giá:</span> {order.priceAdjustment}
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <span className="rounded-full bg-[#EAF8EE] px-3 py-2 text-xs font-semibold text-[#2F855A]">
                                    Tự đánh giá đồ
                                  </span>
                                  <span className="rounded-full bg-[#FFF4E5] px-3 py-2 text-xs font-semibold text-[#B26A00]">
                                    Điều chỉnh giá
                                  </span>
                                </div>
                                {action && (
                                  <div className="mt-4 rounded-[20px] border border-[#D7ECDD] bg-white p-4">
                                    <p className="text-sm text-[#5D776A]">{action.helper}</p>
                                    <button
                                      type="button"
                                      onClick={action.onClick}
                                      className={cn(
                                        'mt-3 rounded-full px-5 py-3 text-sm font-semibold transition-transform duration-300',
                                        action.className
                                      )}
                                    >
                                      {action.label}
                                    </button>
                                  </div>
                                )}
                              </div>
                              <span
                                className={cn(
                                  'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                                  statusMeta[order.status].tone
                                )}
                              >
                                {statusMeta[order.status].label}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </section>

                <section className="space-y-8">
                  <div className="rounded-[28px] border border-[#D7ECDD] bg-[#FCFEFD] p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#2F855A]">Tóm tắt xử lý gần đây</p>
                    <div className="mt-5 space-y-3">
                      {orders.slice(0, 5).map((order) => (
                        <div key={order.id} className="rounded-[24px] bg-[#F9FCFA] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold text-[#103B2D]">{order.code}</p>
                              <p className="mt-1 text-sm text-[#476458]">{order.assignedStaff}</p>
                              <p className="mt-1 text-xs text-[#6E877C]">
                                Khách nhìn thấy: {getCustomerFacingStatus(order.status).label}
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-[#103B2D]">
                              {order.amount > 0 ? currency.format(order.amount) : 'Cần báo giá'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
