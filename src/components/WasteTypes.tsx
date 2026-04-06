'use client';

import { useTranslation } from 'react-i18next';

interface WasteTypesProps {
  onBookingClick: (prefill?: { selectedWaste?: string }) => void;
}

export default function WasteTypes({ onBookingClick }: WasteTypesProps) {
  const { t } = useTranslation();

  const getArray = (key: string) => {
    const val = t(key, { returnObjects: true });
    return Array.isArray(val) ? val : [];
  };

  const wasteTypes = [
    {
      id: 'furniture',
      icon: '🛋️',
      name: t('wasteTypes.types.furniture'),
      description: t('booking.categories.furniture'),
      price: 'Từ 100.000đ / món',
      items: getArray('wasteTypes.items.furniture')
    },
    {
      id: 'electronics',
      icon: '📺',
      name: t('wasteTypes.types.electronics'),
      description: t('booking.categories.electronics'),
      price: 'Từ 80.000đ / món',
      items: getArray('wasteTypes.items.electronics')
    },
    {
      id: 'metals',
      icon: '🔩',
      name: t('wasteTypes.types.metals'),
      description: t('booking.categories.metals'),
      price: 'Từ 8.000đ / kg',
      items: getArray('wasteTypes.items.metals')
    },
    {
      id: 'plastics',
      icon: '🪣',
      name: t('wasteTypes.types.plastics'),
      description: t('booking.categories.plastics'),
      price: 'Từ 5.000đ / kg',
      items: getArray('wasteTypes.items.plastics')
    },
    {
      id: 'paper',
      icon: '📦',
      name: t('wasteTypes.types.paper'),
      description: t('booking.categories.paper'),
      price: 'Từ 3.000đ / kg',
      items: getArray('wasteTypes.items.paper')
    },
    {
      id: 'clothes',
      icon: '👕',
      name: t('wasteTypes.types.clothes'),
      description: t('booking.categories.clothes'),
      price: 'Từ 3.000đ / kg',
      items: getArray('wasteTypes.items.clothes')
    },
    {
      id: 'vehicles',
      icon: '🛵',
      name: t('wasteTypes.types.vehicles'),
      description: t('booking.categories.vehicles'),
      price: 'Từ 100.000đ / món',
      items: getArray('wasteTypes.items.vehicles')
    },
    {
      id: 'other',
      icon: '🧱',
      name: t('wasteTypes.types.other'),
      description: t('booking.categories.other'),
      price: t('booking.quoteLabel'),
      items: getArray('wasteTypes.items.other')
    }
  ];

  return (
    <section id="waste-types" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block rounded-full bg-[#2F855A]/10 px-4 py-1.5 text-sm font-semibold text-[#2F855A] mb-4">
            {t('wasteTypes.badge')}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-[#303030] mb-4">
            {t('wasteTypes.title')}
          </h2>

        </div>

        {/* Waste Types Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {wasteTypes.map((type, index) => (
            <div
              key={index}
              className="group cursor-pointer rounded-[28px] border border-[#D6EEDD] bg-[#F7FCF8] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#2F855A] hover:shadow-[0_18px_45px_rgba(16,59,45,0.08)]"
              onClick={() => onBookingClick({ selectedWaste: type.id })}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm transition-transform duration-300 group-hover:scale-110">
                  {type.icon}
                </div>
                <span className="rounded-full bg-[#E7F8EC] px-3 py-1 text-sm font-bold text-[#2F855A] transition-colors">
                  {type.price}
                </span>
              </div>

              <h3 className="mb-2 mt-4 text-xl font-bold text-[#103B2D]">
                {type.name}
              </h3>
              <p className="mb-4 text-sm text-gray-600 font-medium tracking-wide">
                {type.description}
              </p>

              <div className="flex flex-wrap gap-2">
                {type.items.map((item, idx) => (
                  <span
                    key={idx}
                    className="rounded-full bg-white px-2 py-1 text-xs text-[#24483A]"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between">
                <span className="text-sm font-medium text-[#476458]">
                  {t('wasteTypes.ctaLabel')}
                </span>
                <span className="text-sm font-bold text-[#2F855A]">{t('wasteTypes.ctaButton')}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-12 rounded-[28px] border border-[#D6EEDD] bg-[#103B2D] px-6 py-7 text-white max-w-5xl mx-auto">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#A7E8B6]">
                {t('wasteTypes.specialCase.badge')}
              </p>
              <h3 className="text-2xl font-bold">{t('wasteTypes.specialCase.title')}</h3>
              <p className="mt-2 max-w-2xl text-white/75">
                {t('wasteTypes.specialCase.desc')}
              </p>
            </div>
            <button
              onClick={() => onBookingClick({ selectedWaste: 'custom' })}
              className="rounded-full bg-[#8DE0A6] px-6 py-3 font-semibold text-[#103B2D]"
            >
              {t('wasteTypes.specialCase.button')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
