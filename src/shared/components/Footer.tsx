'use client';

import { useTranslation } from 'react-i18next';

interface FooterProps {
  onBookingClick: () => void;
}

export default function Footer({ onBookingClick }: FooterProps) {
  const { t } = useTranslation();

  return (
    <footer id="contact" className="relative mt-20 overflow-hidden bg-linear-to-r from-[#0B2F24] to-secondary py-20 text-white">
      {/* Decorative Elements */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#8DE0A6]/10 blur-3xl"></div>
      <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[#8DE0A6]/10 blur-3xl"></div>

      <div className="container relative z-10 mx-auto px-4">
        {/* CTA Section */}
        <div className="mb-20 rounded-[40px] border border-white/10 bg-white/5 p-8 text-center backdrop-blur-sm md:p-16">
          <h2 className="mb-6 text-3xl font-bold md:text-5xl lg:text-6xl">
            {t('footer.ctaTitle')}
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-white/70 md:text-xl">
            {t('footer.ctaSubtitle')}
          </p>
          <button
            onClick={onBookingClick}
            className="rounded-full bg-[#8DE0A6] px-10 py-5 text-xl font-bold text-secondary transition-all duration-300 hover:scale-105 hover:shadow-[0_20px_50px_rgba(141,224,166,0.3)]"
          >
            {t('footer.ctaButton')}
          </button>
        </div>

        <div className="grid gap-12 lg:grid-cols-4 lg:gap-8">
          {/* Brand Info */}
          <div className="lg:col-span-1">
            <div className="mb-6 flex items-center space-x-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8DE0A6]">
                <span className="text-xl font-bold text-secondary">E</span>
              </div>
              <span className="text-2xl font-bold tracking-tight">EcoCollect</span>
            </div>
            <p className="mb-8 leading-7 text-white/60">
              {t('footer.brandDesc')}
            </p>
            <div className="flex space-x-4">
              {/* Social placeholders */}
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/5 transition-colors hover:bg-white/10"
                >
                  <div className="h-4 w-4 bg-white/40"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-2 gap-8 lg:col-span-3 lg:grid-cols-3">
            <div>
              <h4 className="mb-6 text-sm font-bold uppercase tracking-widest text-[#8DE0A6]">
                {t('footer.linksTitle')}
              </h4>
              <ul className="space-y-4 text-white/70">
                <li><a href="#home" className="transition-colors hover:text-white">{t('footer.links.home')}</a></li>
                <li><a href="#about" className="transition-colors hover:text-white">{t('footer.links.about')}</a></li>
                <li><a href="#how-it-works" className="transition-colors hover:text-white">{t('footer.links.howItWorks')}</a></li>
                <li><a href="#waste-types" className="transition-colors hover:text-white">{t('footer.links.wasteTypes')}</a></li>
                <li><a href="#reviews" className="transition-colors hover:text-white">{t('footer.links.reviews')}</a></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-6 text-sm font-bold uppercase tracking-widest text-[#8DE0A6]">
                {t('footer.servicesTitle')}
              </h4>
              <ul className="space-y-4 text-white/70">
                <li className="cursor-pointer transition-colors hover:text-white">{t('footer.services.furniture')}</li>
                <li className="cursor-pointer transition-colors hover:text-white">{t('footer.services.electronics')}</li>
                <li className="cursor-pointer transition-colors hover:text-white">{t('footer.services.household')}</li>
                <li className="cursor-pointer transition-colors hover:text-white">{t('footer.services.construction')}</li>
                <li className="cursor-pointer transition-colors hover:text-white">{t('footer.services.recycling')}</li>
              </ul>
            </div>

            <div>
              <h4 className="mb-6 text-sm font-bold uppercase tracking-widest text-[#8DE0A6]">
                {t('footer.contactTitle')}
              </h4>
              <ul className="space-y-4 text-white/70">
                <li className="flex items-start space-x-3">
                  <span>📍</span>
                  <span>Lầu 3, Toà nhà Green, Quận 1, TP.HCM</span>
                </li>
                <li className="flex items-center space-x-3">
                  <span>📞</span>
                  <span>1900 1234 - (028) 7300 xxxx</span>
                </li>
                <li className="flex items-center space-x-3">
                  <span>✉️</span>
                  <span>hello@ecocollect.vn</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-20 border-t border-white/10 pt-10 text-center text-sm text-white/40">
          {t('footer.rights')}
        </div>
      </div>
    </footer>
  );
}
