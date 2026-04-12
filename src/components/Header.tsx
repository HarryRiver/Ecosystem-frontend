'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { type AuthMode, type AuthUser } from '@/lib/auth';
import LanguageSwitcher from './LanguageSwitcher';
import Link from 'next/link';

interface HeaderProps {
  currentUser: AuthUser | null;
  onBookingClick: (prefill?: any) => void;
  onAuthClick: (mode: AuthMode) => void;
  onLogout: () => void;
  onProfileClick: () => void;
  onHistoryClick: () => void;
}

export default function Header({ currentUser, onBookingClick, onAuthClick, onLogout, onProfileClick, onHistoryClick }: HeaderProps) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  const userInitial = currentUser?.name.trim().charAt(0).toUpperCase() ?? 'E';

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0F3D2E]/85 backdrop-blur-xl">
      <div className="w-full max-w-[1440px] mx-auto px-4 xl:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#8DE0A6]">
              <span className="text-white text-xl">♻️</span>
            </div>
            <div>
              <span className="block text-xl font-bold text-white">EcoCollect</span>
              <span className="block text-xs uppercase tracking-[0.2em] text-[#A7E8B6]">
                Green logistics
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center space-x-3 xl:space-x-5">
            <a href="#home" className="whitespace-nowrap text-sm font-medium text-white transition-colors hover:text-[#8DE0A6]">
              {t('header.home')}
            </a>
            <a href="#how-it-works" className="whitespace-nowrap text-sm font-medium text-white transition-colors hover:text-[#8DE0A6]">
              {t('header.howItWorks')}
            </a>
            <a href="#waste-types" className="whitespace-nowrap text-sm font-medium text-white transition-colors hover:text-[#8DE0A6]">
              {t('header.wasteTypes')}
            </a>
            <a href="#about" className="whitespace-nowrap text-sm font-medium text-white transition-colors hover:text-[#8DE0A6]">
              {t('header.about')}
            </a>
            <a href="#pricing" className="whitespace-nowrap text-sm font-medium text-white transition-colors hover:text-[#8DE0A6]">
              {t('header.pricing')}
            </a>
            <a href="#reviews" className="whitespace-nowrap text-sm font-medium text-white transition-colors hover:text-[#8DE0A6]">
              {t('header.reviews')}
            </a>
          </nav>

          <div className="hidden items-center gap-2.5 xl:flex">
            <LanguageSwitcher />
            
            {currentUser ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={`flex items-center gap-3 rounded-full border border-white/12 bg-white/8 px-3 py-2 text-white transition-all duration-300 hover:bg-white/12 ${
                    isUserMenuOpen ? 'ring-2 ring-[#8DE0A6]/40 bg-white/12' : ''
                  }`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#8DE0A6] font-bold text-[#103B2D]">
                    {userInitial}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-semibold leading-none">{currentUser.name}</p>
                    <p className="mt-1 text-xs text-white/60">{currentUser.email}</p>
                  </div>
                  <svg 
                    className={`ml-2 h-4 w-4 text-white/40 transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Desktop Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-3 w-64 overflow-hidden rounded-[28px] border border-white/10 bg-[#0F3D2E]/98 p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-2xl animate-fadeInUp">
                    {/* Mobile Only Header */}
                    <div className="mb-1 px-4 py-4 border-b border-white/5 lg:hidden">
                      <p className="text-sm font-bold text-white tracking-tight">{currentUser.name}</p>
                      <p className="mt-0.5 text-xs text-[#A7E8B6]/60 font-medium truncate">{currentUser.email}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <button 
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onProfileClick();
                        }}
                        className="group flex w-full items-center gap-3.5 rounded-[20px] px-4 py-3 text-left transition-all duration-300 hover:bg-white/8 active:scale-[0.98]"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-lg transition-transform group-hover:scale-110 group-hover:bg-[#8DE0A6]/10">
                          👤
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-white leading-none">
                            {currentLang === 'vi' ? 'Hồ sơ' : (currentLang === 'sv' ? 'Profil' : 'Profile')}
                          </p>
                          <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/30">
                            {currentLang === 'vi' ? 'Thông tin cá nhân' : 'Account info'}
                          </p>
                        </div>
                        <svg className="h-4 w-4 text-white/10 transition-transform group-hover:translate-x-0.5 group-hover:text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      
                      <button 
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onHistoryClick();
                        }}
                        className="group flex w-full items-center gap-3.5 rounded-[20px] px-4 py-3 text-left transition-all duration-300 hover:bg-white/8 active:scale-[0.98]"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-lg transition-transform group-hover:scale-110 group-hover:bg-[#8DE0A6]/10">
                          📋
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-white leading-none">
                            {currentLang === 'vi' ? 'Lịch sử' : (currentLang === 'sv' ? 'Historik' : 'History')}
                          </p>
                          <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/30">
                            {currentLang === 'vi' ? 'Yêu cầu thu gom' : 'Collection requests'}
                          </p>
                        </div>
                        <svg className="h-4 w-4 text-white/10 transition-transform group-hover:translate-x-0.5 group-hover:text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="my-1.5 h-px bg-white/5 mx-2"></div>

                    {currentUser.role === 'admin' && (
                      <>
                        <Link 
                          href="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="group flex w-full items-center gap-3.5 rounded-[20px] px-4 py-3 text-left transition-all duration-300 hover:bg-[#8DE0A6]/10 active:scale-[0.98]"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#8DE0A6]/5 text-lg transition-transform group-hover:scale-110 group-hover:bg-[#8DE0A6]/20">
                            ⚙️
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-[#8DE0A6] leading-none">
                              {currentLang === 'vi' ? 'Quản trị' : 'Admin Panel'}
                            </p>
                            <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8DE0A6]/40">
                              {currentLang === 'vi' ? 'Bảng điều khiển' : 'Dashboard'}
                            </p>
                          </div>
                          <svg className="h-4 w-4 text-[#8DE0A6]/20 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                        <div className="my-1.5 h-px bg-white/5 mx-2"></div>
                      </>
                    )}
                    
                    <button 
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onLogout();
                      }}
                      className="group flex w-full items-center gap-3.5 rounded-[20px] px-4 py-3 text-left transition-all duration-300 hover:bg-red-500/10 active:scale-[0.98]"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/5 text-lg transition-transform group-hover:scale-110">
                        🚪
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-[#FF6B6B] leading-none">{t('header.logout')}</p>
                        <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-red-500/40">
                          {currentLang === 'vi' ? 'Kết thúc phiên' : 'End session'}
                        </p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={() => onAuthClick('login')}
                  className="whitespace-nowrap rounded-full border border-white/14 bg-white/8 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/14"
                >
                  {t('header.login')}
                </button>
                <button
                  onClick={() => onAuthClick('register')}
                  className="whitespace-nowrap rounded-full border border-[#B7F7C8]/40 bg-[#E6FFEE] px-4 py-2 text-sm font-semibold text-[#103B2D] transition-all duration-300 hover:scale-[1.02]"
                >
                  {t('header.register')}
                </button>
              </>
            )}

            <button
              onClick={onBookingClick}
              className="whitespace-nowrap rounded-full bg-[#8DE0A6] px-5 py-2 text-sm font-semibold text-[#103B2D] transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              {t('header.bookNow')}
            </button>
          </div>

          {/* Mobile Actions Container */}
          <div className="flex items-center gap-3 xl:hidden">
            <LanguageSwitcher />
            {/* Mobile Menu Button */}
            <button
              className="text-white p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <nav className="xl:hidden mt-4 pb-4 border-t border-white/20 pt-4 animate-fadeInUp">
            <div className="flex flex-col space-y-4">
              <a href="#home" className="text-white hover:text-[#8DE0A6] transition-colors font-medium">
                {t('header.home')}
              </a>
              <a href="#how-it-works" className="text-white hover:text-[#8DE0A6] transition-colors font-medium">
                {t('header.howItWorks')}
              </a>
              <a href="#waste-types" className="text-white hover:text-[#8DE0A6] transition-colors font-medium">
                {t('header.wasteTypes')}
              </a>
              <a href="#about" className="text-white hover:text-[#8DE0A6] transition-colors font-medium">
                {t('header.about')}
              </a>
              <a href="#pricing" className="text-white hover:text-[#8DE0A6] transition-colors font-medium">
                {t('header.pricing')}
              </a>
              <a href="#reviews" className="text-white hover:text-[#8DE0A6] transition-colors font-medium">
                {t('header.reviews')}
              </a>
              {!currentUser ? (
                <>
                  <button
                    onClick={() => onAuthClick('login')}
                    className="w-full rounded-full border border-white/14 bg-white/8 px-6 py-2.5 font-semibold text-white transition-all duration-300"
                  >
                    {t('header.login')}
                  </button>
                  <button
                    onClick={() => onAuthClick('register')}
                    className="w-full rounded-full border border-[#B7F7C8]/40 bg-[#E6FFEE] px-6 py-2.5 font-semibold text-[#103B2D] transition-all duration-300"
                  >
                    {t('header.register')}
                  </button>
                </>
              ) : (
                <div className="rounded-[24px] border border-white/10 bg-white/8 px-4 py-3 text-white">
                  <p className="font-semibold">{currentUser.name}</p>
                  <p className="mt-1 text-sm text-white/65">{currentUser.email}</p>
                  <button
                    onClick={onLogout}
                    className="mt-3 w-full rounded-full border border-white/14 bg-white/10 px-5 py-2.5 font-semibold text-white"
                  >
                    {t('header.logout')}
                  </button>
                </div>
              )}
              <button
                onClick={onBookingClick}
                className="w-full rounded-full bg-[#8DE0A6] px-6 py-2.5 font-semibold text-[#103B2D] transition-all duration-300"
              >
                {t('header.bookNow')}
              </button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
