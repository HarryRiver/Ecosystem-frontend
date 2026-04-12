'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type AuthMode, type AuthUser } from '@/lib/auth';
import { type HeroQuickOption } from '@/lib/store';

interface HeroProps {
  currentUser: AuthUser | null;
  onAuthClick: (mode: AuthMode) => void;
  onBookingClick: (prefill?: {
    address?: string;
    /** Task 3: lang-agnostic key, e.g. 'furniture', NOT translated label */
    selectedWaste?: string;
  }) => void;
}

/** Task 3: quick option keys — lang-agnostic, map trực tiếp sang category trong BookingModal */
const QUICK_OPTION_KEYS: HeroQuickOption[] = [
  'furniture',
  'electronics',
  'household',
  'construction',
  'other',
];

export default function Hero({ currentUser, onAuthClick, onBookingClick }: HeroProps) {
  const { t } = useTranslation();

  const [quickWaste, setQuickWaste] = useState<HeroQuickOption>(QUICK_OPTION_KEYS[0]);
  const [quickAddress, setQuickAddress] = useState('');

  const handleQuickBooking = () => {
    // Task 3: Truyền key lang-agnostic thay vì translated label
    onBookingClick({
      selectedWaste: quickWaste,
      address: quickAddress.trim(),
    });
  };

  return (
    <header
      id="home"
      aria-label="EcoCollect Hero Section"
      className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(141,224,166,0.22),transparent_30%),linear-gradient(135deg,#0F3D2E_0%,#103B2D_45%,#164A38_100%)] pt-24 pb-12 text-white"
    >
      <div className="absolute inset-0 opacity-30">
        <div className="absolute -left-10 top-10 h-72 w-72 rounded-full bg-[#8DE0A6]/30 blur-3xl"></div>
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-[#F59E0B]/15 blur-3xl"></div>
        <div className="absolute bottom-10 left-1/3 h-64 w-64 rounded-full bg-[#D8FFF1]/10 blur-3xl"></div>
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center rounded-full border border-[#8DE0A6]/30 bg-white/10 px-4 py-2 backdrop-blur-sm">
              <span className="text-sm font-semibold text-[#B7F7C8]">
                {t('hero.badge')}
              </span>
            </div>

            <h1 className="mb-6 text-4xl font-extrabold leading-tight text-white md:text-6xl lg:text-7xl">
              {t('hero.title')}{' '}
              <span className="text-[#8DE0A6]">{t('hero.titleHighlight')}</span>
            </h1>

            <p className="mb-8 max-w-2xl text-lg leading-8 text-white/80 md:text-xl">
              {t('hero.subtitle')}
            </p>

            <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
              <button
                onClick={() => onBookingClick()}
                className="whitespace-nowrap rounded-full bg-[#8DE0A6] px-6 py-3.5 font-bold text-[#103B2D] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl"
              >
                {t('hero.ctaBook')}
              </button>
              {!currentUser && (
                <button
                  onClick={() => onAuthClick('register')}
                  className="whitespace-nowrap rounded-full border border-[#8DE0A6]/40 bg-white/8 px-6 py-3.5 font-semibold text-white transition-all duration-300 hover:bg-white/14"
                >
                  {t('hero.ctaRegister')}
                </button>
              )}
              <a
                href="#about"
                className="whitespace-nowrap flex items-center justify-center rounded-full border border-white/20 bg-transparent px-6 py-3.5 font-semibold text-white transition-all duration-300 hover:bg-white/8"
              >
                {t('hero.ctaAbout')}
              </a>
            </div>


          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/95 p-6 text-[#103B2D] shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
            <div className="mb-6">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#2F855A]">
                {t('hero.quickBookingTitle')}
              </p>
              <h2 className="text-3xl font-bold text-[#103B2D]">
                {t('hero.quickBookingSubtitle')}
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#24483A]">
                  {t('hero.labelWasteType')}
                </label>
                {/* Task 3: value = key (e.g. 'furniture'), option label = translated */}
                <select
                  value={quickWaste}
                  onChange={(event) => setQuickWaste(event.target.value as HeroQuickOption)}
                  className="w-full rounded-2xl border border-[#D6EEDD] bg-[#F7FCF8] px-4 py-4 text-base outline-none transition-colors focus:border-[#22C55E]"
                >
                  {QUICK_OPTION_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {t(`hero.quickOptions.${key}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#24483A]">
                  {t('hero.labelAddress')}
                </label>
                <input
                  type="text"
                  value={quickAddress}
                  onChange={(event) => setQuickAddress(event.target.value)}
                  placeholder={t('hero.placeholderAddress')}
                  className="w-full rounded-2xl border border-[#D6EEDD] bg-[#F7FCF8] px-4 py-4 text-base outline-none transition-colors placeholder:text-[#7A9287] focus:border-[#22C55E]"
                />
              </div>


              <button
                onClick={handleQuickBooking}
                className="w-full rounded-full bg-[#103B2D] px-6 py-4 text-base font-bold text-white transition-transform duration-300 hover:-translate-y-0.5"
              >
                {t('hero.applyToForm')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
