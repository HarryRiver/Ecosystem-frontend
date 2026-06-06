'use client';

import { useTranslation } from 'react-i18next';

interface PricingProps {
  onBookingClick: () => void;
}

export default function Pricing({ onBookingClick }: PricingProps) {
  const { t } = useTranslation();


  const reasons = [
    { icon: '⚡', title: t('pricing.reasons.realtime.title'), desc: t('pricing.reasons.realtime.desc') },
    { icon: '🚚', title: t('pricing.reasons.shipping.title'), desc: t('pricing.reasons.shipping.desc') },
    { icon: '♻️', title: t('pricing.reasons.green.title'), desc: t('pricing.reasons.green.desc') },
    { icon: '📱', title: t('pricing.reasons.payment.title'), desc: t('pricing.reasons.payment.desc') },
    { icon: '🎯', title: t('pricing.reasons.ontime.title'), desc: t('pricing.reasons.ontime.desc') },
    { icon: '🛡️', title: t('pricing.reasons.insured.title'), desc: t('pricing.reasons.insured.desc') },
  ];

  return (
    <section id="pricing" className="relative overflow-hidden bg-gradient-to-br from-secondary to-[#1D5A45] py-20">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-[#8DE0A6] opacity-10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-white opacity-10 blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">

          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t('pricing.title')}
          </h2>

        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-white/20 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-[#8DE0A6]/20 blur-3xl"></div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
              {reasons.map((item, index) => (
                <div key={index} className="group flex flex-col items-center text-center space-y-4 p-4 transition-all duration-300 hover:bg-white/5 rounded-2xl">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#8DE0A6] text-2xl shadow-lg transform transition-transform group-hover:scale-110 group-hover:rotate-3">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg mb-2">{item.title}</h4>
                    <p className="text-white/70 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <button
            onClick={onBookingClick}
            className="inline-flex items-center space-x-2 rounded-full bg-[#8DE0A6] px-10 py-4 text-lg font-bold text-secondary transition-all duration-300 hover:scale-105 hover:shadow-2xl"
          >
            <span>{t('pricing.cta')}</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
