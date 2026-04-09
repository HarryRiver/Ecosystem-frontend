'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { adminAccounts } from '../../data/adminMock';
import {
  currency,
  defaultCustomers,
  defaultOrders,
  getCustomerFacingStatus,
  Order,
  statusFilters,
  statusMeta,
} from '../../lib/store';
import { cn } from '../../utils/cn';

export default function AdminUsersPage() {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    (typeof statusFilters)[number]['id']
  >('all');
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const customers = defaultCustomers;
  const orders: Order[] = defaultOrders;

  const customerRows = useMemo(() => {
    return customers
      .map((customer) => {
        const customerOrders = orders.filter(
          (order) => order.customerId === customer.id,
        );
        const latestOrder = [...customerOrders].sort((a, b) =>
          b.schedule.date.localeCompare(a.schedule.date),
        )[0];
        const totalSpent = customerOrders.reduce(
          (sum, order) => sum + order.finalAmount,
          0,
        );

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
  }, [customers, normalizedQuery, orders, statusFilter]);

  const memberCount = customers.filter(
    (customer) => customer.accountType === 'member',
  ).length;

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] border border-[#D7ECDD] bg-[linear-gradient(135deg,_#103B2D_0%,_#18543F_100%)] p-6 text-white shadow-[0_28px_80px_rgba(16,59,45,0.18)]">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#A7E8B6]">
          Trang quan ly user
        </p>
        <h1 className="mt-3 text-4xl font-bold">
          Kiem soat ho so khach hang va tai khoan admin
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/78">
          Trang nay tap trung vao du lieu nguoi dung: khach vang lai, thanh vien,
          don gan nhat, muc chi tieu va nhom tai khoan admin dang dung de van
          hanh he thong.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            label: 'Tong user',
            value: customers.length,
            note: `${memberCount} thanh vien / ${customers.length - memberCount} khach vang lai`,
          },
          {
            label: 'Khach co canh bao',
            value: customers.filter((customer) => customer.noShowCount > 0).length,
            note: 'Dung de danh dau can thanh toan truoc',
          },
          {
            label: 'Tai khoan admin demo',
            value: adminAccounts.length,
            note: 'Dung cho phan trinh bay nghiep vu quan tri',
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
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#2F855A]">
              Tai khoan admin demo
            </p>
            <h2 className="mt-2 text-2xl font-bold">
              Mock data de test vai tro quan tri
            </h2>
          </div>
          <div className="rounded-full bg-[#F3FBF5] px-4 py-2 text-sm text-[#476458]">
            Co the dung de demo quyen van hanh, CSKH va quan tri cap cao
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {adminAccounts.map((admin) => (
            <article
              key={admin.id}
              className="rounded-[28px] border border-[#D7ECDD] bg-[#F9FCFA] p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2F855A]">
                    {admin.id}
                  </p>
                  <h3 className="mt-2 text-xl font-bold text-[#103B2D]">
                    {admin.name}
                  </h3>
                  <p className="mt-1 text-sm text-[#476458]">{admin.role}</p>
                </div>
                <span className="rounded-full bg-[#103B2D] px-3 py-1 text-xs font-semibold text-white">
                  {admin.shift}
                </span>
              </div>

              <div className="mt-5 rounded-[22px] bg-white p-4 text-sm text-[#476458]">
                <p>
                  <span className="font-semibold text-[#103B2D]">Email:</span>{' '}
                  {admin.email}
                </p>
                <p className="mt-2">
                  <span className="font-semibold text-[#103B2D]">
                    Mat khau mock:
                  </span>{' '}
                  {admin.password}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {admin.permissions.map((permission) => (
                  <span
                    key={permission}
                    className="rounded-full bg-[#E6FFEE] px-3 py-1 text-xs font-semibold text-[#2F855A]"
                  >
                    {permission}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[32px] border border-[#D7ECDD] bg-white p-6 shadow-[0_18px_45px_rgba(16,59,45,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#2F855A]">
              Danh sach user
            </p>
            <h2 className="mt-2 text-2xl font-bold">
              Quan ly tai khoan khach hang va don gan nhat
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(220px,1fr)_auto]">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tim theo ten, email hoac so dien thoai"
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
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3 text-left">
            <thead>
              <tr className="text-sm uppercase tracking-[0.12em] text-[#6D877A]">
                <th className="px-4">Khach hang</th>
                <th className="px-4">Loai tai khoan</th>
                <th className="px-4">Don gan nhat</th>
                <th className="px-4">Trang thai admin</th>
                <th className="px-4">Trang thai khach thay</th>
                <th className="px-4">Tong chi</th>
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
                          ? 'Thanh vien'
                          : 'Khach vang lai'}
                      </span>
                      <p className="mt-2 text-xs text-[#6D877A]">
                        {customer.ordersCount} don • {customer.district}
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
                            {customer.latestOrder.schedule.date} •{' '}
                            {customer.latestOrder.schedule.timeSlot}
                          </p>
                        </>
                      ) : (
                        <span>Chua co don</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {customer.latestOrder ? (
                        <span
                          className={cn(
                            'rounded-full px-3 py-1 text-xs font-semibold',
                            statusMeta[customer.latestOrder.status].tone,
                          )}
                        >
                          {statusMeta[customer.latestOrder.status].label}
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
                          {customerStatus.label}
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
