'use client';

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { type AuthMode, type AuthUser } from '@/lib/auth';
import { login as apiLogin, register as apiRegister } from '@/services/auth.service';
import { ApiError } from '@/lib/apiClient';

interface AuthModalProps {
  isOpen: boolean;
  mode: AuthMode;
  onClose: () => void;
  onModeChange: (mode: AuthMode) => void;
  onSuccess: (user: AuthUser) => void;
}

interface AuthFormState {
  name: string;
  phone: string;
  email: string;
  password: string;
  acceptPolicy: boolean;
}

const initialFormState: AuthFormState = {
  name: '',
  phone: '',
  email: '',
  password: '',
  acceptPolicy: true,
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^(0|\+84)\d{9,10}$/;

function normalizePhone(phone: string) {
  return phone.replace(/\s+/g, '').trim();
}

export default function AuthModal({
  isOpen,
  mode,
  onClose,
  onModeChange,
  onSuccess,
}: AuthModalProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<AuthFormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const benefitCards = [
    {
      title: t('auth.benefits.voucher.title'),
      description: t('auth.benefits.voucher.desc'),
    },
    {
      title: t('auth.benefits.history.title'),
      description: t('auth.benefits.history.desc'),
    },
    {
      title: t('auth.benefits.tracking.title'),
      description: t('auth.benefits.tracking.desc'),
    },
  ];

  function getAuthValidationMessage(mode: AuthMode) {
    return mode === 'login'
      ? t('common.error') // Use generic or add specific keys if needed
      : t('common.error');
  }

  useEffect(() => {
    if (!isOpen) {
      setErrorMessage('');
      setFieldErrors({});
      setIsSubmitting(false);
      setForm((currentForm) => ({
        ...currentForm,
        password: '',
      }));
      setShowPassword(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setErrorMessage('');
    setFieldErrors({});
  }, [isOpen, mode]);

  const isEmailValid = emailPattern.test(form.email.trim());
  const isPasswordValid = form.password.trim().length >= 6;
  const isNameValid = form.name.trim().length >= 2;
  const isPhoneValid = phonePattern.test(normalizePhone(form.phone));
  const isFormValid =
    mode === 'login'
      ? isEmailValid && isPasswordValid
      : isNameValid && isPhoneValid && isEmailValid && isPasswordValid && form.acceptPolicy;

  const handleFieldChange = (field: keyof AuthFormState) => (event: ChangeEvent<HTMLInputElement>) => {
    let nextValue: string | boolean = field === 'acceptPolicy' ? event.target.checked : event.target.value;
    let skipClearError = false;

    if (field === 'password' && typeof nextValue === 'string') {
      if (/[^\x20-\x7E]/.test(nextValue)) {
        nextValue = nextValue.replace(/[^\x20-\x7E]/g, '');
        setFieldErrors((prev) => ({ ...prev, password: 'Vui lòng tắt gõ Tiếng Việt để nhập mật khẩu' }));
        skipClearError = true;
      }
    }

    setForm((currentForm) => ({
      ...currentForm,
      [field]: nextValue,
    }));

    // Clear field-specific error when user starts typing
    if (fieldErrors[field] && !skipClearError) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }

    if (errorMessage !== '') {
      setErrorMessage('');
    }
  };

  const handleModeSwitch = (nextMode: AuthMode) => {
    if (nextMode === mode) {
      return;
    }

    setErrorMessage('');
    onModeChange(nextMode);
  };

  const resetForm = () => {
    setForm(initialFormState);
    setErrorMessage('');
    setFieldErrors({});
    setIsSubmitting(false);
    setShowPassword(false);
  };

  const handleForgotPassword = () => {
    if (!isEmailValid) {
      setErrorMessage(mode === 'login' ? 'Nhập email tài khoản trước' : '');
      return;
    }
    setErrorMessage('Tính năng quên mật khẩu đang được phát triển.');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Per-field validation for register mode
    if (mode === 'register') {
      const errors: Record<string, string> = {};
      if (!form.name.trim()) errors.name = 'Vui lòng nhập họ và tên';
      if (!form.phone.trim()) errors.phone = 'Vui lòng nhập số điện thoại';
      if (!form.email.trim()) {
        errors.email = 'Vui lòng nhập Email';
      } else if (!emailPattern.test(form.email.trim())) {
        errors.email = 'Email không đúng định dạng';
      }
      if (!form.password.trim()) errors.password = 'Vui lòng nhập mật khẩu';
      
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }
      setFieldErrors({});
    }

    // Per-field validation for login mode
    if (mode === 'login') {
      const errors: Record<string, string> = {};
      if (!form.email.trim()) {
        errors.email = 'Vui lòng nhập Email';
      } else if (!emailPattern.test(form.email.trim())) {
        errors.email = 'Email không đúng định dạng';
      }
      if (!form.password.trim()) errors.password = 'Vui lòng nhập mật khẩu';

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }
      setFieldErrors({});
    }

    if (!isFormValid) {
      setErrorMessage(getAuthValidationMessage(mode));
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const payload = await apiLogin({
          identity: form.email,
          password: form.password,
        });
        // Map ApiUser → AuthUser shape còn dùng trong App cũ
        const user: AuthUser = {
          name: payload.user.full_name,
          email: payload.user.email,
          phone: payload.user.phone,
          role: payload.user.role,
        };
        resetForm();
        onSuccess(user);
      } else {
        const payload = await apiRegister({
          full_name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
        });
        const user: AuthUser = {
          name: payload.user.full_name,
          email: payload.user.email,
          phone: payload.user.phone,
          role: payload.user.role,
        };
        resetForm();
        onSuccess(user);
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Có lỗi xảy ra. Vui lòng thử lại.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-[#08110D]/72 p-4 backdrop-blur-md">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[32px] bg-white shadow-[0_32px_120px_rgba(0,0,0,0.28)] lg:grid-cols-[0.94fr_1.06fr]">
        <aside className="hidden lg:block bg-[linear-gradient(155deg,_#0F3D2E_0%,_#134B38_52%,_#1E6B4E_100%)] p-7 text-white">
          <div className="inline-flex items-center rounded-full border border-white/12 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#B7F7C8]">
            {t('auth.badge')}
          </div>
          <h2 className="mt-5 text-3xl font-bold leading-tight">
            {t('auth.sidebarTitle')}
          </h2>
          <p className="mt-4 text-sm leading-7 text-white/76">
            {t('auth.sidebarSubtitle')}
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
            {t('auth.suggestion')}
          </div>
        </aside>

        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-3xl font-bold text-[#103B2D]">
                {mode === 'login' ? t('auth.login.title') : t('auth.register.title')}
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
              { key: 'login' as const, label: t('header.login') },
              { key: 'register' as const, label: t('header.register') },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => handleModeSwitch(item.key)}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                  mode === item.key ? 'bg-[#103B2D] text-white' : 'text-[#476458]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <form className="mt-7" onSubmit={handleSubmit} noValidate>
            {mode === 'login' ? (
              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#24483A]">
                    {t('auth.login.emailLabel')} <span className="font-normal text-[#789185]">(hoặc Số điện thoại)</span>
                  </label>
                  <input
                    type="text"
                    value={form.email}
                    onChange={handleFieldChange('email')}
                    placeholder="email@example.com hoặc 09xxxxxxxx"
                    autoComplete="username"
                    disabled={isSubmitting}
                    className={`w-full rounded-[24px] border bg-[#F7FCF8] px-4 py-4 text-base outline-none transition-colors focus:border-[#22C55E] disabled:cursor-not-allowed disabled:bg-[#F0F6F2] ${fieldErrors.email ? 'border-red-400' : 'border-[#D6EEDD]'}`}
                  />
                  {fieldErrors.email && (
                    <p className="mt-1.5 text-xs font-medium text-red-500">{fieldErrors.email}</p>
                  )}
                  <p className="mt-2 text-xs text-[#5D776A]">
                    Gợi ý: Dùng <code className="font-semibold text-[#103B2D]">admin@ecocollect.vn</code> (pass: admin123) để vào trang quản trị.
                  </p>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label className="text-sm font-semibold text-[#24483A]">{t('auth.login.passwordLabel')}</label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-sm font-medium text-[#2F855A]"
                    >
                      {t('auth.login.forgotPassword')}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={handleFieldChange('password')}
                      placeholder="......"
                      autoComplete="current-password"
                      disabled={isSubmitting}
                      className={`w-full rounded-[24px] border bg-[#F7FCF8] px-4 py-4 pr-12 text-base outline-none transition-colors focus:border-[#22C55E] disabled:cursor-not-allowed disabled:bg-[#F0F6F2] ${fieldErrors.password ? 'border-red-400' : 'border-[#D6EEDD]'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7A9287] hover:text-[#2F855A] transition-colors"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      )}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="mt-1.5 text-xs font-medium text-red-500">{fieldErrors.password}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#24483A]">{t('auth.register.nameLabel')}</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={handleFieldChange('name')}
                    placeholder="Name"
                    autoComplete="name"
                    disabled={isSubmitting}
                    className={`w-full rounded-[24px] border bg-[#F7FCF8] px-4 py-4 text-base outline-none transition-colors focus:border-[#22C55E] disabled:cursor-not-allowed disabled:bg-[#F0F6F2] ${fieldErrors.name ? 'border-red-400' : 'border-[#D6EEDD]'}`}
                  />
                  {fieldErrors.name && (
                    <p className="mt-1.5 text-xs font-medium text-red-500">{fieldErrors.name}</p>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#24483A]">{t('auth.register.phoneLabel')}</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={handleFieldChange('phone')}
                      placeholder="0901234567"
                      autoComplete="tel"
                      disabled={isSubmitting}
                      className={`w-full rounded-[24px] border bg-[#F7FCF8] px-4 py-4 text-base outline-none transition-colors focus:border-[#22C55E] disabled:cursor-not-allowed disabled:bg-[#F0F6F2] ${fieldErrors.phone ? 'border-red-400' : 'border-[#D6EEDD]'}`}
                    />
                    {fieldErrors.phone && (
                      <p className="mt-1.5 text-xs font-medium text-red-500">{fieldErrors.phone}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#24483A]">{t('auth.register.emailLabel')}</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={handleFieldChange('email')}
                      placeholder="ban@company.com"
                      autoComplete="email"
                      disabled={isSubmitting}
                      className={`w-full rounded-[24px] border bg-[#F7FCF8] px-4 py-4 text-base outline-none transition-colors focus:border-[#22C55E] disabled:cursor-not-allowed disabled:bg-[#F0F6F2] ${fieldErrors.email ? 'border-red-400' : 'border-[#D6EEDD]'}`}
                    />
                    {fieldErrors.email && (
                      <p className="mt-1.5 text-xs font-medium text-red-500">{fieldErrors.email}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#24483A]">{t('auth.register.passwordLabel')}</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={handleFieldChange('password')}
                      placeholder="......"
                      autoComplete="new-password"
                      disabled={isSubmitting}
                      className={`w-full rounded-[24px] border bg-[#F7FCF8] px-4 py-4 pr-12 text-base outline-none transition-colors focus:border-[#22C55E] disabled:cursor-not-allowed disabled:bg-[#F0F6F2] ${fieldErrors.password ? 'border-red-400' : 'border-[#D6EEDD]'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7A9287] hover:text-[#2F855A] transition-colors"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      )}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="mt-1.5 text-xs font-medium text-red-500">{fieldErrors.password}</p>
                  )}
                </div>
                <label className="flex items-start gap-3 rounded-[24px] border border-[#D6EEDD] bg-[#F9FCFA] p-4 text-sm text-[#476458]">
                  <input
                    type="checkbox"
                    checked={form.acceptPolicy}
                    onChange={handleFieldChange('acceptPolicy')}
                    className="mt-1"
                    disabled={isSubmitting}
                  />
                  <span>
                    {t('auth.register.policy')}
                  </span>
                </label>
              </div>
            )}

            {errorMessage !== '' && (
              <div
                className="mt-5 rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
                aria-live="polite"
              >
                {errorMessage}
              </div>
            )}

            <div className="mt-7 rounded-[24px] border border-[#D6EEDD] bg-[#F7FCF8] p-4 text-sm text-[#476458]">
              {mode === 'login'
                ? t('auth.login.footer')
                : t('auth.register.footer')}
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[#789185]">
                {mode === 'login' ? t('auth.login.switch').split('?')[0] + '?' : t('auth.register.switch').split('?')[0] + '?'}
                <button
                  type="button"
                  onClick={() => handleModeSwitch(mode === 'login' ? 'register' : 'login')}
                  className="ml-2 font-semibold text-[#2F855A]"
                >
                  {mode === 'login' ? t('auth.login.switch').split('?')[1] : t('auth.register.switch').split('?')[1]}
                </button>
              </p>

              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full bg-[#103B2D] px-7 py-3 font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-[#95B0A1]"
              >
                {isSubmitting
                  ? t('common.loading')
                  : mode === 'login'
                    ? t('auth.login.submit')
                    : t('auth.register.submit')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
