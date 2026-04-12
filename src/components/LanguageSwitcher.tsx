'use client';

import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect } from 'react';

const languages = [
  { code: 'vi', name: 'Tiếng Việt', flagUrl: 'https://flagcdn.com/w40/vn.png' },
  { code: 'en', name: 'English', flagUrl: 'https://flagcdn.com/w40/gb.png' },
  { code: 'sv', name: 'Svenska', flagUrl: 'https://flagcdn.com/w40/se.png' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex shrink-0 w-max items-center gap-2 rounded-full border border-white/14 bg-white/8 px-3 py-1.5 text-sm font-medium text-white transition-all hover:bg-white/14"
        aria-label="Chọn ngôn ngữ"
      >
        <img
          src={currentLanguage.flagUrl}
          alt={currentLanguage.code}
          className="w-5 block object-contain rounded-[2px] shadow-sm"
        />
        <span className="hidden sm:flex items-center uppercase tracking-wider text-[10px] leading-none mt-px">
          {currentLanguage.code}
        </span>
        <svg
          className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 right-0 mt-2 w-40 origin-top-right overflow-hidden rounded-2xl border border-white/16 bg-[#0F3D2E]/95 shadow-2xl backdrop-blur-xl animate-fadeInScale">
          <div className="py-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                  i18n.language === lang.code
                    ? 'bg-[#8DE0A6] font-semibold text-[#103B2D]'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <span className="w-6 shrink-0 flex items-center justify-center">
                  <img
                    src={lang.flagUrl}
                    alt={lang.code}
                    className="w-5 block object-contain rounded-[2px]"
                  />
                </span>
                <span className="leading-none mt-px">{lang.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
