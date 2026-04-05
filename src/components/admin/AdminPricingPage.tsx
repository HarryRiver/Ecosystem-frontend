'use client';

import { useMemo, useState } from 'react';
import { currency, initialServicePricing } from '../../data/adminDashboardMock';

export default function AdminPricingPage() {
  const [servicePricing, setServicePricing] = useState(initialServicePricing);

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

  const averagePrice = useMemo(() => {
    if (servicePricing.length === 0) {
      return 0;
    }

    return servicePricing.reduce((sum, service) => sum + service.price, 0) / servicePricing.length;
  }, [servicePricing]);

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] border border-[#D7ECDD] bg-[linear-gradient(135deg,_#103B2D_0%,_#18543F_100%)] p-6 text-white shadow-[0_28px_80px_rgba(16,59,45,0.18)]">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#A7E8B6]">Trang cập nhật giá</p>
        <h1 className="mt-3 text-4xl font-bold">Điều chỉnh bảng giá dịch vụ thu gom</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/78">
          Admin có thể kiểm soát giá mock của từng hạng mục, theo dõi nhóm dịch vụ và diễn giải lý do áp
          dụng mức giá hiện tại cho đội vận hành và đội CSKH.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Tổng dịch vụ đang quản lý', value: servicePricing.length, note: 'Bao gồm nội thất, điện tử và nhóm đặc thù' },
          { label: 'Giá trung bình', value: currency.format(averagePrice), note: 'Tính trên danh sách mock hiện tại' },
          { label: 'Nhóm có kiểm tra thực tế', value: servicePricing.filter((service) => service.unitLabel === '/kg').length, note: 'Cần staff xác nhận lại khi tới hiện trường' },
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

      <section className="rounded-[32px] border border-[#D7ECDD] bg-white p-6 shadow-[0_18px_45px_rgba(16,59,45,0.06)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#2F855A]">Bảng giá dịch vụ</p>
            <h2 className="mt-2 text-2xl font-bold">Cập nhật giá cả theo từng hạng mục</h2>
          </div>
          <div className="rounded-full bg-[#F3FBF5] px-4 py-2 text-sm text-[#476458]">
            Mock action: tăng hoặc giảm 10.000đ cho từng dịch vụ
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {servicePricing.map((service) => (
            <article
              key={service.id}
              className="rounded-[28px] border border-[#D7ECDD] bg-[#F9FCFA] p-5 shadow-[0_12px_32px_rgba(16,59,45,0.05)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2F855A]">
                    {service.category}
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-[#103B2D]">{service.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#5D776A]">{service.note}</p>
                </div>
                <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#103B2D]">
                  {service.id}
                </span>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-white p-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.14em] text-[#6D877A]">Mức giá hiện tại</p>
                  <p className="mt-2 text-3xl font-bold text-[#103B2D]">
                    {currency.format(service.price)}
                    <span className="ml-1 text-base font-medium text-[#6D877A]">{service.unitLabel}</span>
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => adjustServicePrice(service.id, -10000)}
                    className="rounded-full border border-[#D7ECDD] bg-white px-4 py-3 text-sm font-semibold text-[#476458] transition-colors hover:border-[#2F855A] hover:text-[#103B2D]"
                  >
                    Giảm 10.000đ
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustServicePrice(service.id, 10000)}
                    className="rounded-full bg-[#103B2D] px-4 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                  >
                    Tăng 10.000đ
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
