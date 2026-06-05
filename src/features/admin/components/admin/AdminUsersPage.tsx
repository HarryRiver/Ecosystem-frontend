'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  currency,
  getCustomerFacingStatus,
  Order,
  readCustomers,
  readOrders,
  statusFilters,
  statusMeta,
  writeCustomers,
} from '@/shared/lib/store';
import {
  findCustomerForOrder,
  getPaginatedItems,
  mapApiUserToCustomerRecord,
} from '@/shared/lib/adminApiAdapters';
import { getAdminUsers } from '@/features/admin/services/admin.service';
import { cn } from '@/shared/utils/cn';
import { useTranslation } from 'react-i18next';

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    (typeof statusFilters)[number]['id']
  >('all');
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const [customers, setCustomers] = useState(() => readCustomers());
  const [orders] = useState<Order[]>(() => readOrders());
  const [isLoading, setIsLoading] = useState(false);
  const [apiNotice, setApiNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    getAdminUsers({ role: 'customer', page: 1, limit: 200 })
      .then((response) => {
        if (cancelled) return;
        const nextCustomers = getPaginatedItems(response).map(mapApiUserToCustomerRecord);
        setCustomers(nextCustomers);
        writeCustomers(nextCustomers);
        setApiNotice(null);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error('[Admin] API failed:', error);
        setApiNotice('Không tải được dữ liệu người dùng từ API. Đang giữ dữ liệu cục bộ nếu có.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const customerRows = useMemo(() => {
    return customers
      .map((customer) => {
        const customerOrders = orders.filter((order) => findCustomerForOrder(order, [customer]));
        const latestOrder = [...customerOrders].sort((a, b) => b.schedule.date.localeCompare(a.schedule.date))[0];
        const totalSpent = customerOrders.reduce((sum, order) => sum + order.finalAmount, 0);

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

        const matchesStatus =
          statusFilter === 'all' || customer.latestOrder?.status === statusFilter;

        return matchesQuery && matchesStatus;
      });
  }, [normalizedQuery, statusFilter, customers, orders]);

  const memberCount = customers.filter(
    (customer) => customer.accountType === 'member',
  ).length;

  return (
    <div className="space-y-8">
      <section className="hidden md:block rounded-[32px] border border-[#D7ECDD] bg-[linear-gradient(135deg,_#103B2D_0%,_#18543F_100%)] p-6 text-white shadow-[0_28px_80px_rgba(16,59,45,0.18)]">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#A7E8B6]">
          {t('admin.users.pageTitle', 'Trang quản lý user')}
        </p>
        <h1 className="mt-3 text-4xl font-bold">
          {t('admin.users.pageSubtitle', 'Kiểm soát hồ sơ khách hàng và tài khoản admin')}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/78">
          {t('admin.users.pageDesc', 'Trang này tập trung vào dữ liệu người dùng: khách vãng lai, thành viên, đơn gần nhất, mức chi tiêu và nhóm tài khoản admin đang dùng để vận hành hệ thống.')}
        </p>
        {isLoading && (
          <p className="mt-4 inline-flex rounded-full bg-white/12 px-4 py-2 text-sm font-semibold text-white">
            {t('admin.users.loading', 'Đang tải dữ liệu user....')}
          </p>
        )}
      </section>

      <div className="hidden md:grid gap-4 md:grid-cols-2">
        {[
          {
            label: t('admin.users.totalUsers', 'Tổng người dùng'),
            value: customers.length,
            note: t('admin.users.totalUsersNote', '{{memberCount}} thành viên / {{guestCount}} khách vãng lai', { memberCount, guestCount: customers.length - memberCount }),
          },
          {
            label: t('admin.users.warnedUsers', 'Khách có cảnh báo'),
            value: customers.filter((customer) => customer.noShowCount > 0).length,
            note: t('admin.users.warnedUsersNote', 'Dùng để đánh dấu cần thanh toán trước'),
          },
        ].map((card) => (
          <section
            key={card.label}
            className="rounded-[28px] border border-[#D7ECDD] bg-white p-5 shadow-[0_18px_45px_rgba(16,59,45,0.06)]"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2F855A]">
              {card.label}
            </p>
            <div className="mt-3 text-3xl font-bold text-[#103B2D]">
              {card.value}
            </div>
            <p className="mt-2 text-sm text-[#5D776A]">{card.note}</p>
          </section>
        ))}
      </div>

      <section className="rounded-[32px] border border-[#D7ECDD] bg-white p-6 shadow-[0_18px_45px_rgba(16,59,45,0.06)]">
        {(isLoading || apiNotice) && (
          <div className="mb-5 rounded-[20px] border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-800">
            {isLoading ? t('admin.users.loading', 'Đang tải dữ liệu user....') : apiNotice}
          </div>
        )}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#2F855A]">
              {t('admin.users.listTitle', 'Danh sách người dùng')}
            </p>
            <h2 className="mt-2 text-2xl font-bold">
              {t('admin.users.listSubtitle', 'Quản lý tài khoản khách hàng và đơn gần nhất')}
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(220px,1fr)_auto]">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('admin.users.searchPlaceholder', 'Tìm theo tên, email hoặc số điện thoại')}
              className="h-12 rounded-full border border-[#CFE4D5] bg-[#F9FCFA] px-5 text-sm outline-none transition-colors placeholder:text-[#6D877A] focus:border-[#2F855A]"
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
                      : 'bg-[#F3FBF5] text-[#476458] hover:bg-[#E6FFEE]',
                  )}
                >
                  {t(`admin.orders.status.${filter.id}`, filter.label)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3 text-left">
            <thead>
              <tr className="text-sm uppercase tracking-[0.12em] text-[#6D877A]">
                <th className="px-4">{t('admin.users.table.customer', 'Khách hàng')}</th>
                <th className="px-4">{t('admin.users.table.accountType', 'Loại tài khoản')}</th>
                <th className="px-4">{t('admin.users.table.latestOrder', 'Đơn gần nhất')}</th>
                <th className="px-4">{t('admin.users.table.adminStatus', 'Trạng thái admin')}</th>
                <th className="px-4">{t('admin.users.table.customerStatus', 'Trạng thái khách thấy')}</th>
                <th className="px-4">{t('admin.users.table.totalSpent', 'Tổng chi')}</th>
              </tr>
            </thead>
            <tbody>
              {customerRows.map((customer) => {
                const customerStatus = customer.latestOrder
                  ? getCustomerFacingStatus(customer.latestOrder.status)
                  : null;

                return (
                  <tr
                    key={customer.id}
                    className="rounded-[24px] bg-[#F9FCFA] text-sm text-[#476458]"
                  >
                    <td className="rounded-l-[24px] px-4 py-4">
                      <div className="font-semibold text-[#103B2D]">
                        {customer.name}
                      </div>
                      <p className="mt-1">{customer.email}</p>
                      <p>{customer.phone}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          'rounded-full px-3 py-1 text-xs font-semibold',
                          customer.accountType === 'member'
                            ? 'bg-[#E6FFEE] text-[#2F855A]'
                            : 'bg-[#FFF4E6] text-[#C05621]',
                        )}
                      >
                        {customer.accountType === 'member'
                          ? 'Thành viên'
                          : 'Khách vãng lai'}
                      </span>
                      <p className="mt-2 text-xs text-[#6D877A]">
                        {customer.ordersCount} đơn • {customer.district}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      {customer.latestOrder ? (
                        <>
                          <div className="font-semibold text-[#103B2D]">
                            {customer.latestOrder.code}
                          </div>
                          <p className="mt-1">{customer.latestOrder.itemSummary}</p>
                          <p className="text-xs text-[#6D877A]">
                            {customer.latestOrder.schedule.date} • {customer.latestOrder.schedule.timeSlot}
                          </p>
                        </>
                      ) : (
                        <span>Chưa có đơn</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {customer.latestOrder ? (
                        <span
                          className={cn(
                            'rounded-full px-3 py-1 text-xs font-semibold',
                            statusMeta[customer.latestOrder.status].tone
                          )}
                        >
                          {t(`admin.orders.status.${customer.latestOrder.status}`, statusMeta[customer.latestOrder.status].label)}
                        </span>
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {customerStatus ? (
                        <span
                          className={cn(
                            'rounded-full px-3 py-1 text-xs font-semibold',
                            customerStatus.tone,
                          )}
                        >
                          {t(`admin.orders.status.${customer.latestOrder?.status}`, customerStatus.label)}
                        </span>
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                    <td className="rounded-r-[24px] px-4 py-4 font-semibold text-[#103B2D]">
                      {currency.format(customer.totalSpent)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
