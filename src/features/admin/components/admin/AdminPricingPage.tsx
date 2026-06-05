'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  currency,
  readPricing,
  ServicePriceRecord,
  writePricing,
} from '@/shared/lib/store';
import {
  getPaginatedItems,
  mapApiServiceToServicePriceRecord,
} from '@/shared/lib/adminApiAdapters';
import { getAdminServices, updateAdminService } from '@/features/admin/services/admin.service';

export default function AdminPricingPage() {
  const [servicePricing, setServicePricing] = useState<ServicePriceRecord[]>(() => readPricing());
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [isLoading, setIsLoading] = useState(false);
  const [apiNotice, setApiNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    getAdminServices({ page: 1, limit: 200 })
      .then((response) => {
        if (cancelled) return;
        const nextPricing = getPaginatedItems(response).map(mapApiServiceToServicePriceRecord);
        setServicePricing(nextPricing);
        writePricing(nextPricing);
        setApiNotice(null);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error('[Admin] API failed:', error);
        setApiNotice('Không tải được bảng giá từ API. Đang giữ dữ liệu cục bộ nếu có.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Persist to store whenever pricing changes
  useEffect(() => {
    writePricing(servicePricing);
  }, [servicePricing]);

  const adjustServicePrice = (serviceId: string, delta: number) => {
    const service = servicePricing.find((item) => item.id === serviceId);
    const nextPrice = Math.max(0, (service?.price ?? 0) + delta);

    setServicePricing((currentServices) =>
      currentServices.map((service) =>
        service.id === serviceId
          ? {
              ...service,
              price: nextPrice,
            }
          : service
      )
    );

    updateAdminService(serviceId, { base_price: nextPrice })
      .then(() => setApiNotice(null))
      .catch((error: unknown) => {
        console.error('[Admin] API failed:', error);
        setApiNotice('Cập nhật giá API thất bại. UI đã giữ thay đổi cục bộ.');
      });
  };

  const updateServicePrice = (serviceId: string, nextPrice: number) => {
    const sanitizedPrice = isNaN(nextPrice) ? 0 : Math.max(0, nextPrice);

    setServicePricing((currentServices) =>
      currentServices.map((service) =>
        service.id === serviceId
          ? {
              ...service,
              price: sanitizedPrice,
            }
          : service
      )
    );

    updateAdminService(serviceId, { base_price: sanitizedPrice })
      .then(() => setApiNotice(null))
      .catch((error: unknown) => {
        console.error('[Admin] API failed:', error);
        setApiNotice('Cập nhật giá API thất bại. UI đã giữ thay đổi cục bộ.');
      });
  };

  const averagePrice = useMemo(() => {
    if (servicePricing.length === 0) {
      return 0;
    }

    return servicePricing.reduce((sum, service) => sum + service.price, 0) / servicePricing.length;
  }, [servicePricing]);

  const groupedPricing = useMemo(() => {
    const groups: Record<string, ServicePriceRecord[]> = {};
    servicePricing.forEach((s) => {
      if (!groups[s.category]) groups[s.category] = [];
      groups[s.category].push(s);
    });
    return groups;
  }, [servicePricing]);

  const categoriesList = useMemo(() => {
    return ['Tất cả', ...Object.keys(groupedPricing)];
  }, [groupedPricing]);

  return (
    <div className="space-y-8">
      <section className="hidden md:block rounded-[32px] border border-[#D7ECDD] bg-[linear-gradient(135deg,_#103B2D_0%,_#18543F_100%)] p-6 text-white shadow-[0_28px_80px_rgba(16,59,45,0.18)]">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#A7E8B6]">Trang cập nhật giá</p>
        <h1 className="mt-3 text-4xl font-bold">Điều chỉnh bảng giá dịch vụ thu gom</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/78">
          Admin có thể kiểm soát giá của từng hạng mục. Giá được lưu vào store chung —
          user thấy ngay sau khi admin cập nhật.
        </p>
      </section>

      <div className="hidden md:grid gap-4 md:grid-cols-3">
        {[
          { label: 'Tổng dịch vụ đang quản lý', value: servicePricing.length, note: 'Bao gồm nội thất, điện tử và nhóm đặc thù' },
          { label: 'Giá trung bình', value: currency.format(averagePrice), note: 'Tính trên danh sách giá hiện tại' },
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
        {(isLoading || apiNotice) && (
          <div className="mb-5 rounded-[20px] border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-800">
            {isLoading ? 'Đang tải bảng giá từ API...' : apiNotice}
          </div>
        )}

        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#2F855A]">Bảng giá dịch vụ</p>
            <h2 className="mt-2 text-2xl font-bold">Cập nhật giá cả theo từng hạng mục</h2>
          </div>
        </div>

        {/* Menu Tabs */}
        <div className="mt-6 flex flex-wrap gap-2">
          {categoriesList.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${
                selectedCategory === cat
                  ? 'bg-[#103B2D] text-white shadow-md'
                  : 'bg-[#F3FBF5] text-[#2F855A] hover:bg-[#D7ECDD]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-12">
          {!isLoading && servicePricing.length === 0 && (
            <div className="rounded-[28px] border border-[#D7ECDD] bg-[#F9FCFA] py-16 text-center text-[#6D877A]">
              Chưa có dữ liệu bảng giá.
            </div>
          )}

          {Object.entries(groupedPricing)
            .filter(([category]) => selectedCategory === 'Tất cả' || category === selectedCategory)
            .map(([category, services]) => (
            <div key={category}>
              <h3 className="mb-4 text-xl font-bold text-[#103B2D] border-b border-[#D7ECDD] pb-2">
                Phân loại: {category}
              </h3>
              <div className="grid gap-4 lg:grid-cols-2">
                {services.map((service) => (
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

                    <div className="mt-6 space-y-4 rounded-[24px] bg-white p-4 shadow-[inset_0_2px_8px_rgba(16,59,45,0.02)]">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                        <div className="group relative">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6D877A]">Mức giá hiện tại</p>
                          <div className="mt-2 flex items-baseline gap-2">
                            <div className="flex items-baseline gap-2 rounded-xl border border-transparent transition-all focus-within:border-[#D6EEDD] focus-within:bg-[#F3FBF5]">
                              <input
                                id={`price-input-${service.id}`}
                                type="number"
                                value={service.price}
                                onChange={(e) => updateServicePrice(service.id, parseInt(e.target.value))}
                                onFocus={(e) => e.target.select()}
                                className="w-32 bg-transparent text-4xl font-bold text-[#103B2D] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                              />
                              <span className="text-lg font-medium text-[#6D877A]">{service.unitLabel}</span>
                              <label
                                htmlFor={`price-input-${service.id}`}
                                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-[#EAF8EE] text-[#2F855A] shadow-sm transition-colors hover:bg-[#D7F5DE]"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </label>
                            </div>
                          </div>
                        </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
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
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
