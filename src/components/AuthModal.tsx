'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { findAdminAccount } from '../data/adminMock';

export type AuthMode = 'login' | 'register';

export interface AuthUser {
  name: string;
  email: string;
  phone: string;
}

interface AuthModalProps {
  isOpen: boolean;
  mode: AuthMode;
  onClose: () => void;
  onModeChange: (mode: AuthMode) => void;
  onSuccess: (user: AuthUser) => void;
}

const benefitCards = [
  {
    title: 'Voucher thành viên',
    description: 'Đăng ký để nhận ưu đãi 10% cho lần đặt tiếp theo và các mã giảm giá theo chiến dịch.',
  },
  {
    title: 'Lưu địa chỉ và lịch sử đơn',
    description: 'Tự động điền lại thông tin đã dùng trước đó, đặt lịch nhanh hơn cho các lần sau.',
  },
  {
    title: 'Theo dõi đơn thuận tiện',
    description: 'Xem tiến độ, email xác nhận và các khuyến mãi cá nhân hóa trong cùng một tài khoản.',
  },
];

export default function AuthModal({
  isOpen,
  mode,
  onClose,
  onModeChange,
  onSuccess,
}: AuthModalProps) {
  const router = useRouter();
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [acceptPolicy, setAcceptPolicy] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setErrorMessage('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const isLoginValid =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail.trim()) && loginPassword.trim().length >= 6;
  const isRegisterPhoneValid = /^(0|\+84)\d{9,10}$/.test(registerPhone.replace(/\s+/g, ''));
  const isRegisterValid =
    registerName.trim().length >= 2 &&
    isRegisterPhoneValid &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerEmail.trim()) &&
    registerPassword.trim().length >= 6 &&
    acceptPolicy;

  const handleLogin = async () => {
    if (!isLoginValid) {
      setErrorMessage('Vui lòng nhập email hợp lệ và mật khẩu tối thiểu 6 ký tự.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    setIsSubmitting(false);

    const matchedAdmin = findAdminAccount(loginEmail, loginPassword);
    if (matchedAdmin) {
      onClose();
      router.push('/admin');
      return;
    }

    onSuccess({
      name: loginEmail.split('@')[0].replace(/[._-]/g, ' ') || 'Khách EcoCollect',
      email: loginEmail.trim(),
      phone: '',
    });
  };

  const handleRegister = async () => {
    if (!isRegisterValid) {
      setErrorMessage('Vui lòng điền đủ họ tên, số điện thoại, email và mật khẩu hợp lệ.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1100));
    setIsSubmitting(false);
    onSuccess({
      name: registerName.trim(),
      email: registerEmail.trim(),
      phone: registerPhone.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-[#08110D]/72 p-4 backdrop-blur-md">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[32px] bg-white shadow-[0_32px_120px_rgba(0,0,0,0.28)] lg:grid-cols-[0.94fr_1.06fr]">
        <aside className="bg-[linear-gradient(155deg,_#0F3D2E_0%,_#134B38_52%,_#1E6B4E_100%)] p-7 text-white">
          <div className="inline-flex items-center rounded-full border border-white/12 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#B7F7C8]">
            EcoCollect member access
          </div>
          <h2 className="mt-5 text-3xl font-bold leading-tight">
            Đặt lịch không cần tài khoản,
            <br />
            nhưng có account sẽ tiện hơn nhiều
          </h2>
          <p className="mt-4 text-sm leading-7 text-white/76">
            Khách vẫn có thể đặt lịch như bình thường. Tài khoản chỉ là lớp trải nghiệm cộng thêm:
            lưu thông tin, nhận voucher và theo dõi đơn thuận tiện hơn.
          </p>

          <div className="mt-7 space-y-3">
            {benefitCards.map((card) => (
              <div key={card.title} className="rounded-[24px] border border-white/10 bg-white/10 p-4">
                <p className="font-semibold">{card.title}</p>
                <p className="mt-1 text-sm leading-6 text-white/72">{card.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-7 rounded-[24px] border border-[#8DE0A6]/20 bg-[#D9FCE6]/10 p-4 text-sm leading-6 text-white/82">
            Gợi ý nghiệp vụ hiện tại: khách đăng ký tài khoản sau lần đặt đầu tiên sẽ nhận voucher cho
            lần kế tiếp thay vì giảm ngay tại checkout để hạn chế abuse.
          </div>
        </aside>

        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#2F855A]">
                Account UI
              </p>
              <h3 className="mt-2 text-3xl font-bold text-[#103B2D]">
                {mode === 'login' ? 'Đăng nhập tài khoản' : 'Tạo tài khoản EcoCollect'}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EEF6F0] text-[#103B2D] transition-colors hover:bg-[#E2F0E6]"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mt-6 inline-flex rounded-full bg-[#F3F8F4] p-1">
            {[
              { key: 'login' as const, label: 'Đăng nhập' },
              { key: 'register' as const, label: 'Đăng ký' },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => onModeChange(item.key)}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                  mode === item.key ? 'bg-[#103B2D] text-white' : 'text-[#476458]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {mode === 'login' ? (
            <div className="mt-7 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#24483A]">Email tài khoản</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(event) => setLoginEmail(event.target.value)}
                  placeholder="ban@company.com"
                  className="w-full rounded-[24px] border border-[#D6EEDD] bg-[#F7FCF8] px-4 py-4 text-base outline-none transition-colors focus:border-[#22C55E]"
                />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="text-sm font-semibold text-[#24483A]">Mật khẩu</label>
                  <button type="button" className="text-sm font-medium text-[#2F855A]">
                    Quên mật khẩu?
                  </button>
                </div>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full rounded-[24px] border border-[#D6EEDD] bg-[#F7FCF8] px-4 py-4 text-base outline-none transition-colors focus:border-[#22C55E]"
                />
              </div>
            </div>
          ) : (
            <div className="mt-7 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#24483A]">Họ và tên</label>
                <input
                  type="text"
                  value={registerName}
                  onChange={(event) => setRegisterName(event.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full rounded-[24px] border border-[#D6EEDD] bg-[#F7FCF8] px-4 py-4 text-base outline-none transition-colors focus:border-[#22C55E]"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#24483A]">Số điện thoại</label>
                  <input
                    type="tel"
                    value={registerPhone}
                    onChange={(event) => setRegisterPhone(event.target.value)}
                    placeholder="0901234567"
                    className="w-full rounded-[24px] border border-[#D6EEDD] bg-[#F7FCF8] px-4 py-4 text-base outline-none transition-colors focus:border-[#22C55E]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#24483A]">Email</label>
                  <input
                    type="email"
                    value={registerEmail}
                    onChange={(event) => setRegisterEmail(event.target.value)}
                    placeholder="ban@company.com"
                    className="w-full rounded-[24px] border border-[#D6EEDD] bg-[#F7FCF8] px-4 py-4 text-base outline-none transition-colors focus:border-[#22C55E]"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#24483A]">Mật khẩu</label>
                <input
                  type="password"
                  value={registerPassword}
                  onChange={(event) => setRegisterPassword(event.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full rounded-[24px] border border-[#D6EEDD] bg-[#F7FCF8] px-4 py-4 text-base outline-none transition-colors focus:border-[#22C55E]"
                />
              </div>
              <label className="flex items-start gap-3 rounded-[24px] border border-[#D6EEDD] bg-[#F9FCFA] p-4 text-sm text-[#476458]">
                <input
                  type="checkbox"
                  checked={acceptPolicy}
                  onChange={(event) => setAcceptPolicy(event.target.checked)}
                  className="mt-1"
                />
                <span>
                  Tôi đồng ý nhận email xác nhận đơn, voucher thành viên và thông tin ưu đãi phù hợp với
                  nhu cầu thu gom.
                </span>
              </label>
            </div>
          )}

          {errorMessage !== '' && (
            <div className="mt-5 rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {errorMessage}
            </div>
          )}

          <div className="mt-7 rounded-[24px] border border-[#D6EEDD] bg-[#F7FCF8] p-4 text-sm text-[#476458]">
            {mode === 'login'
              ? 'Đăng nhập để tự động điền lại email và dùng voucher thành viên ở các lần đặt sau.'
              : 'Đăng ký không bắt buộc cho đơn hiện tại. Khách vẫn có thể đặt lịch như guest nếu muốn thao tác nhanh.'}
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[#789185]">
              {mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản rồi?'}
              <button
                type="button"
                onClick={() => onModeChange(mode === 'login' ? 'register' : 'login')}
                className="ml-2 font-semibold text-[#2F855A]"
              >
                {mode === 'login' ? 'Tạo tài khoản' : 'Đăng nhập'}
              </button>
            </p>

            <button
              type="button"
              onClick={mode === 'login' ? handleLogin : handleRegister}
              disabled={isSubmitting}
              className="rounded-full bg-[#103B2D] px-7 py-3 font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-[#95B0A1]"
            >
              {isSubmitting
                ? 'Đang xử lý...'
                : mode === 'login'
                  ? 'Đăng nhập'
                  : 'Tạo tài khoản và nhận ưu đãi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
