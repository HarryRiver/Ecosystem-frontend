'use client';

import { useState } from 'react';
import { type AuthMode, type AuthUser } from './AuthModal';

interface HeroProps {
  currentUser: AuthUser | null;
  onAuthClick: (mode: AuthMode) => void;
  onBookingClick: (prefill?: {
    address?: string;
    handlingGoal?: string;
    selectedWaste?: string;
  }) => void;
}

const quickOptions = [
  'Nội thất cồng kềnh',
  'Thiết bị điện tử',
  'Rác sinh hoạt đóng bao',
  'Phế thải xây dựng',
  'Món khác cần báo giá',
];

export default function Hero({ currentUser, onAuthClick, onBookingClick }: HeroProps) {
  const [quickWaste, setQuickWaste] = useState(quickOptions[0]);
  const [quickAddress, setQuickAddress] = useState('');
  const [quickGoal, setQuickGoal] = useState('Ưu tiên tái chế');

  const handleQuickBooking = () => {
    onBookingClick({
      selectedWaste: quickWaste,
      address: quickAddress.trim(),
      handlingGoal: quickGoal,
    });
  };

  return (
    <section
      id="home"
      className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(141,224,166,0.22),_transparent_30%),linear-gradient(135deg,_#0F3D2E_0%,_#103B2D_45%,_#164A38_100%)] pt-28 text-white"
    >
      <div className="absolute inset-0 opacity-30">
        <div className="absolute -left-10 top-10 h-72 w-72 rounded-full bg-[#8DE0A6]/30 blur-3xl"></div>
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-[#F59E0B]/15 blur-3xl"></div>
        <div className="absolute bottom-10 left-1/3 h-64 w-64 rounded-full bg-[#D8FFF1]/10 blur-3xl"></div>
      </div>

      <div className="container relative z-10 mx-auto px-4 pb-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center rounded-full border border-[#8DE0A6]/30 bg-white/10 px-4 py-2 backdrop-blur-sm">
              <span className="text-sm font-semibold text-[#B7F7C8]">
                Eco-tech platform cho thu gom, phân loại và xử lý rác
              </span>
            </div>

            <h1 className="mb-6 text-4xl font-extrabold leading-tight text-white md:text-6xl lg:text-7xl">
              Thu gom rác thông minh,
              <br />
              <span className="text-[#8DE0A6]">xử lý xanh cho đô thị hiện đại</span>
            </h1>

            <p className="mb-8 max-w-2xl text-lg leading-8 text-white/80 md:text-xl">
              Đặt lịch trong 60 giây, nhận báo giá minh bạch theo loại rác, kích thước
              và đơn vị tính. Mọi đơn hàng đều được theo dõi từ thu gom đến xử lý.
            </p>

            <div className="mb-10 flex flex-col gap-4 sm:flex-row">
              <button
                onClick={() => onBookingClick()}
                className="rounded-full bg-[#8DE0A6] px-8 py-4 text-lg font-bold text-[#103B2D] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl"
              >
                Đặt lịch ngay
              </button>
              {!currentUser && (
                <button
                  onClick={() => onAuthClick('register')}
                  className="rounded-full border border-[#8DE0A6]/40 bg-white/[0.08] px-8 py-4 text-lg font-semibold text-white transition-all duration-300 hover:bg-white/[0.14]"
                >
                  Tạo tài khoản nhận ưu đãi
                </button>
              )}
              <a
                href="#about"
                className="rounded-full border border-white/20 bg-transparent px-8 py-4 text-lg font-semibold text-white transition-all duration-300 hover:bg-white/[0.08]"
              >
                Xem về chúng tôi
              </a>
            </div>

            <div className="mb-10 flex flex-wrap items-center gap-3 text-sm text-white/75">
              {currentUser ? (
                <>
                  <span className="rounded-full border border-[#8DE0A6]/24 bg-[#8DE0A6]/10 px-4 py-2 text-[#C9F8D5]">
                    Đang đăng nhập với {currentUser.email}
                  </span>
                  <span className="rounded-full border border-white/12 bg-white/[0.06] px-4 py-2">
                    Thông tin thành viên sẽ được tự điền ở bước đặt lịch
                  </span>
                </>
              ) : (
                <>
                  <span className="rounded-full border border-white/12 bg-white/[0.06] px-4 py-2">
                    Đặt lịch không cần account
                  </span>
                  <span className="rounded-full border border-[#8DE0A6]/24 bg-[#8DE0A6]/10 px-4 py-2 text-[#C9F8D5]">
                    Có tài khoản để lưu địa chỉ, lịch sử đơn và voucher
                  </span>
                </>
              )}
            </div>

            <div className="grid max-w-2xl gap-4 sm:grid-cols-3">
              {[
                { value: '10K+', label: 'Đơn hàng đã xử lý' },
                { value: '92%', label: 'Rác được phân tuyến tái chế' },
                { value: '4.9/5', label: 'Điểm hài lòng khách hàng' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-3xl border border-white/10 bg-white/[0.08] p-5 backdrop-blur-sm"
                >
                  <div className="text-3xl font-bold text-white">{stat.value}</div>
                  <div className="mt-1 text-sm text-white/70">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/95 p-6 text-[#103B2D] shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
            <div className="mb-6">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#2F855A]">
                Booking nhanh trên banner
              </p>
              <h2 className="text-3xl font-bold text-[#103B2D]">
                Lên lịch thu gom chỉ với vài thông tin cơ bản
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#24483A]">
                  Chọn loại rác
                </label>
                <select
                  value={quickWaste}
                  onChange={(event) => setQuickWaste(event.target.value)}
                  className="w-full rounded-2xl border border-[#D6EEDD] bg-[#F7FCF8] px-4 py-4 text-base outline-none transition-colors focus:border-[#22C55E]"
                >
                  {quickOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#24483A]">
                  Địa chỉ thu gom
                </label>
                <input
                  type="text"
                  value={quickAddress}
                  onChange={(event) => setQuickAddress(event.target.value)}
                  placeholder="Ví dụ: 12 Nguyễn Huệ, Quận 1, TP.HCM"
                  className="w-full rounded-2xl border border-[#D6EEDD] bg-[#F7FCF8] px-4 py-4 text-base outline-none transition-colors placeholder:text-[#7A9287] focus:border-[#22C55E]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#24483A]">
                  Mục tiêu xử lý
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {['Ưu tiên tái chế', 'Thu gom trong ngày'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setQuickGoal(tag)}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
                        quickGoal === tag
                          ? 'border-[#22C55E] bg-[#F0FBF3] text-[#103B2D]'
                          : 'border-[#D6EEDD] bg-white text-[#24483A] hover:border-[#22C55E] hover:bg-[#F0FBF3]'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleQuickBooking}
                className="w-full rounded-full bg-[#103B2D] px-6 py-4 text-base font-bold text-white transition-transform duration-300 hover:-translate-y-0.5"
              >
                Áp dụng thông tin này vào form chi tiết
              </button>
            </div>

            <div className="mt-6 rounded-3xl bg-[#F5FBF6] p-5">
              <p className="mb-3 text-sm font-semibold text-[#2F855A]">
                Khác biệt trong trải nghiệm
              </p>
              <div className="grid gap-3 text-sm text-[#476458] sm:grid-cols-2">
                <div className="rounded-2xl bg-white p-4">Ước tính giá theo size, số lượng và đơn vị tính</div>
                <div className="rounded-2xl bg-white p-4">Có mục “Không thấy món của bạn?” để gửi yêu cầu riêng</div>
              </div>
            </div>

            {!currentUser ? (
              <div className="mt-4 rounded-3xl border border-[#D6EEDD] bg-white p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#2F855A]">
                      Guest checkout + account
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#476458]">
                      Khách có thể đặt nhanh không cần đăng nhập. Nếu tạo tài khoản, hệ thống sẽ lưu thông
                      tin và mở khóa ưu đãi cho các đơn sau.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => onAuthClick('login')}
                      className="rounded-full border border-[#D6EEDD] px-4 py-3 text-sm font-semibold text-[#103B2D] transition-colors hover:bg-[#F5FBF6]"
                    >
                      Đăng nhập
                    </button>
                    <button
                      type="button"
                      onClick={() => onAuthClick('register')}
                      className="rounded-full bg-[#103B2D] px-4 py-3 text-sm font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5"
                    >
                      Đăng ký nhận voucher
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-3xl border border-[#D6EEDD] bg-white p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#2F855A]">
                  Thành viên EcoCollect
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-[#F5FBF6] p-4 text-sm leading-6 text-[#476458]">
                    Thông tin email và số điện thoại sẽ được ưu tiên tự điền trong flow đặt lịch để thao tác nhanh hơn.
                  </div>
                  <div className="rounded-2xl bg-[#F5FBF6] p-4 text-sm leading-6 text-[#476458]">
                    Các ưu đãi, voucher và lịch sử đơn tiếp theo sẽ gắn trực tiếp với tài khoản hiện tại.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
