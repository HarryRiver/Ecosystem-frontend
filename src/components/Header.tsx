'use client';

import { useState } from 'react';
import { type AuthMode, type AuthUser } from './AuthModal';

interface HeaderProps {
  currentUser: AuthUser | null;
  onBookingClick: () => void;
  onAuthClick: (mode: AuthMode) => void;
  onLogout: () => void;
}

export default function Header({ currentUser, onBookingClick, onAuthClick, onLogout }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const userInitial = currentUser?.name.trim().charAt(0).toUpperCase() ?? 'E';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0F3D2E]/85 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-4">
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
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#home" className="text-white hover:text-[#FF6A13] transition-colors font-medium">
              Trang chủ
            </a>
            <a href="#how-it-works" className="text-white hover:text-[#FF6A13] transition-colors font-medium">
              Cách hoạt động
            </a>
            <a href="#waste-types" className="text-white hover:text-[#FF6A13] transition-colors font-medium">
              Loại rác
            </a>
            <a href="#about" className="text-white hover:text-[#8DE0A6] transition-colors font-medium">
              Về chúng tôi
            </a>
            <a href="#pricing" className="text-white hover:text-[#8DE0A6] transition-colors font-medium">
              Bảng giá
            </a>
            <a href="#reviews" className="text-white hover:text-[#8DE0A6] transition-colors font-medium">
              Đánh giá
            </a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {currentUser ? (
              <>
                <div className="flex items-center gap-3 rounded-full border border-white/12 bg-white/8 px-3 py-2 text-white">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#8DE0A6] font-bold text-[#103B2D]">
                    {userInitial}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold leading-none">{currentUser.name}</p>
                    <p className="mt-1 text-xs text-white/60">{currentUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="rounded-full border border-white/14 bg-white/8 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-white/14"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onAuthClick('login')}
                  className="rounded-full border border-white/14 bg-white/8 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-white/14"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => onAuthClick('register')}
                  className="rounded-full border border-[#B7F7C8]/40 bg-[#E6FFEE] px-5 py-2.5 font-semibold text-[#103B2D] transition-all duration-300 hover:scale-[1.02]"
                >
                  Tạo tài khoản
                </button>
              </>
            )}

            <button
              onClick={onBookingClick}
              className="rounded-full bg-[#8DE0A6] px-6 py-2.5 font-semibold text-[#103B2D] transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              Đặt lịch ngay
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white p-2"
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

        {/* Mobile Menu */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 border-t border-white/20 pt-4 animate-fadeInUp">
            <div className="flex flex-col space-y-4">
              <a href="#home" className="text-white hover:text-[#FF6A13] transition-colors font-medium">
                Trang chủ
              </a>
              <a href="#how-it-works" className="text-white hover:text-[#8DE0A6] transition-colors font-medium">
                Cách hoạt động
              </a>
              <a href="#waste-types" className="text-white hover:text-[#8DE0A6] transition-colors font-medium">
                Loại rác
              </a>
              <a href="#about" className="text-white hover:text-[#8DE0A6] transition-colors font-medium">
                Về chúng tôi
              </a>
              <a href="#pricing" className="text-white hover:text-[#8DE0A6] transition-colors font-medium">
                Bảng giá
              </a>
              <a href="#reviews" className="text-white hover:text-[#8DE0A6] transition-colors font-medium">
                Đánh giá
              </a>
              {!currentUser ? (
                <>
                  <button
                    onClick={() => onAuthClick('login')}
                    className="w-full rounded-full border border-white/14 bg-white/8 px-6 py-2.5 font-semibold text-white transition-all duration-300"
                  >
                    Đăng nhập
                  </button>
                  <button
                    onClick={() => onAuthClick('register')}
                    className="w-full rounded-full border border-[#B7F7C8]/40 bg-[#E6FFEE] px-6 py-2.5 font-semibold text-[#103B2D] transition-all duration-300"
                  >
                    Tạo tài khoản
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
                    Đăng xuất
                  </button>
                </div>
              )}
              <button
                onClick={onBookingClick}
                className="w-full rounded-full bg-[#8DE0A6] px-6 py-2.5 font-semibold text-[#103B2D] transition-all duration-300"
              >
                Đặt lịch ngay
              </button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
