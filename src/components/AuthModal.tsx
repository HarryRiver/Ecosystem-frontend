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

type AuthPanel = 'credentials' | 'forgotPassword';
type ForgotPasswordStep = 'email' | 'otp' | 'password' | 'done';

interface ForgotPasswordFormState {
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

const initialFormState: AuthFormState = {
  name: '',
  phone: '',
  email: '',
  password: '',
  acceptPolicy: true,
};

const initialForgotPasswordFormState: ForgotPasswordFormState = {
  otp: '',
  newPassword: '',
  confirmPassword: '',
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^(0|\+84)\d{9,10}$/;
const forgotPasswordMockAccount = {
  email: 'tester@ecocollect.vn',
  otp: '123456',
};

function normalizePhone(phone: string) {
  return phone.replace(/\s+/g, '').trim();
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
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
  const [successMessage, setSuccessMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [activePanel, setActivePanel] = useState<AuthPanel>('credentials');
  const [forgotPasswordStep, setForgotPasswordStep] = useState<ForgotPasswordStep>('email');
  const [forgotPasswordForm, setForgotPasswordForm] = useState<ForgotPasswordFormState>(initialForgotPasswordFormState);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetPasswordConfirm, setShowResetPasswordConfirm] = useState(false);

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

  function resetForgotPasswordFlow() {
    setForgotPasswordStep('email');
    setForgotPasswordForm(initialForgotPasswordFormState);
    setShowResetPassword(false);
    setShowResetPasswordConfirm(false);
  }

  useEffect(() => {
    if (!isOpen) {
      setErrorMessage('');
      setSuccessMessage('');
      setFieldErrors({});
      setIsSubmitting(false);
      setForm((currentForm) => ({
        ...currentForm,
        password: '',
      }));
      setShowPassword(false);
      setActivePanel('credentials');
      resetForgotPasswordFlow();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setFieldErrors({});
    setActivePanel('credentials');
    resetForgotPasswordFlow();
  }, [isOpen, mode]);

  const isForgotPasswordPanel = activePanel === 'forgotPassword';
  const forgotPasswordDescription =
    forgotPasswordStep === 'otp'
      ? t('auth.forgot.otpDescription')
      : forgotPasswordStep === 'password'
        ? t('auth.forgot.passwordDescription')
        : forgotPasswordStep === 'done'
          ? ''
          : t('auth.forgot.description');
  const forgotPasswordSubmitLabel =
    forgotPasswordStep === 'otp'
      ? t('auth.forgot.verifyOtp')
      : forgotPasswordStep === 'password'
        ? t('auth.forgot.savePassword')
        : forgotPasswordStep === 'done'
          ? t('auth.forgot.backToLogin')
          : t('auth.forgot.submit');
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

    if (successMessage !== '') {
      setSuccessMessage('');
    }
  };

  const handleForgotPasswordFieldChange =
    (field: keyof ForgotPasswordFormState) => (event: ChangeEvent<HTMLInputElement>) => {
      let nextValue = event.target.value;
      let skipClearError = false;

      if (field === 'otp') {
        nextValue = nextValue.replace(/\D/g, '').slice(0, forgotPasswordMockAccount.otp.length);
      }

      if (field !== 'otp' && /[^\x20-\x7E]/.test(nextValue)) {
        nextValue = nextValue.replace(/[^\x20-\x7E]/g, '');
        setFieldErrors((prev) => ({
          ...prev,
          [field]: t('auth.forgot.passwordAsciiOnly'),
        }));
        skipClearError = true;
      }

      setForgotPasswordForm((currentForm) => ({
        ...currentForm,
        [field]: nextValue,
      }));

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

      if (successMessage !== '') {
        setSuccessMessage('');
      }
    };

  const handleModeSwitch = (nextMode: AuthMode) => {
    if (nextMode === mode && activePanel === 'credentials') {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setFieldErrors({});
    setActivePanel('credentials');
    resetForgotPasswordFlow();

    if (nextMode !== mode) {
      onModeChange(nextMode);
    }
  };

  const resetForm = () => {
    setForm(initialFormState);
    setErrorMessage('');
    setSuccessMessage('');
    setFieldErrors({});
    setIsSubmitting(false);
    setShowPassword(false);
    setActivePanel('credentials');
    resetForgotPasswordFlow();
  };

  const handleForgotPassword = () => {
    setErrorMessage('');
    setSuccessMessage('');
    setFieldErrors({});
    setShowPassword(false);
    setActivePanel('forgotPassword');
    resetForgotPasswordFlow();
  };

  const handleUseForgotPasswordMock = () => {
    setForm((currentForm) => ({
      ...currentForm,
      email: forgotPasswordMockAccount.email,
    }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.email;
      return next;
    });
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleUseForgotPasswordMockOtp = () => {
    setForgotPasswordForm((currentForm) => ({
      ...currentForm,
      otp: forgotPasswordMockAccount.otp,
    }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.otp;
      return next;
    });
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isForgotPasswordPanel) {
      const errors: Record<string, string> = {};
      const normalizedEmail = normalizeEmail(form.email);

      if (forgotPasswordStep === 'email') {
        if (!normalizedEmail) {
          errors.email = t('auth.forgot.emailRequired');
        } else if (!emailPattern.test(normalizedEmail)) {
          errors.email = t('auth.forgot.emailInvalid');
        } else if (normalizedEmail !== forgotPasswordMockAccount.email) {
          errors.email = t('auth.forgot.mockNotFound');
        }

        if (Object.keys(errors).length > 0) {
          setFieldErrors(errors);
          setSuccessMessage('');
          return;
        }

        setFieldErrors({});
        setErrorMessage('');
        setSuccessMessage(t('auth.forgot.otpSent'));
        setForgotPasswordStep('otp');
        return;
      }

      if (forgotPasswordStep === 'otp') {
        if (!forgotPasswordForm.otp.trim()) {
          errors.otp = t('auth.forgot.otpRequired');
        } else if (forgotPasswordForm.otp !== forgotPasswordMockAccount.otp) {
          errors.otp = t('auth.forgot.otpInvalid');
        }

        if (Object.keys(errors).length > 0) {
          setFieldErrors(errors);
          setSuccessMessage('');
          return;
        }

        setFieldErrors({});
        setErrorMessage('');
        setSuccessMessage('');
        setForgotPasswordStep('password');
        return;
      }

      if (forgotPasswordStep === 'password') {
        if (forgotPasswordForm.newPassword.trim().length < 6) {
          errors.newPassword = t('auth.forgot.newPasswordInvalid');
        }

        if (!forgotPasswordForm.confirmPassword.trim()) {
          errors.confirmPassword = t('auth.forgot.confirmPasswordRequired');
        } else if (forgotPasswordForm.confirmPassword !== forgotPasswordForm.newPassword) {
          errors.confirmPassword = t('auth.forgot.confirmPasswordMismatch');
        }

        if (Object.keys(errors).length > 0) {
          setFieldErrors(errors);
          setSuccessMessage('');
          return;
        }

        setFieldErrors({});
        setErrorMessage('');
        setSuccessMessage('');
        setForgotPasswordStep('done');
        return;
      }

      if (forgotPasswordStep === 'done') {
        handleModeSwitch('login');
        setSuccessMessage('');
        return;
      }
    }

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
      <div className="grid w-full max-w-5xl max-h-[calc(100dvh-2rem)] overflow-y-auto overflow-x-hidden rounded-[32px] bg-white shadow-[0_32px_120px_rgba(0,0,0,0.28)] lg:grid-cols-[0.94fr_1.06fr]">
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
                {isForgotPasswordPanel
                  ? t('auth.forgot.title')
                  : mode === 'login'
                    ? t('auth.login.title')
                    : t('auth.register.title')}
              </h3>
              {isForgotPasswordPanel && (
                <p className="mt-3 max-w-md text-sm leading-6 text-[#476458]">
                  {forgotPasswordDescription}
                </p>
              )}
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

          {!isForgotPasswordPanel && (
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
          )}

          <form className={isForgotPasswordPanel ? 'mt-6' : 'mt-7'} onSubmit={handleSubmit} noValidate>
            {isForgotPasswordPanel ? (
              <div className="space-y-5">
                {forgotPasswordStep !== 'done' && (
                  <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-[#789185]">
                    {[
                      { key: 'email', label: t('auth.forgot.stepEmail') },
                      { key: 'otp', label: t('auth.forgot.stepOtp') },
                      { key: 'password', label: t('auth.forgot.stepPassword') },
                    ].map((item) => {
                      const stepOrder: ForgotPasswordStep[] = ['email', 'otp', 'password'];
                      const isActiveStep = forgotPasswordStep === item.key;
                      const isCompletedStep =
                        stepOrder.indexOf(item.key as ForgotPasswordStep) < stepOrder.indexOf(forgotPasswordStep);

                      return (
                        <div
                          key={item.key}
                          className={`rounded-[8px] border px-3 py-2 text-center ${
                            isActiveStep
                              ? 'border-[#2F855A] bg-[#F0FBF3] text-[#103B2D]'
                              : isCompletedStep
                                ? 'border-[#BFE8CB] bg-white text-[#2F855A]'
                                : 'border-[#E2ECE6] bg-white'
                          }`}
                        >
                          {item.label}
                        </div>
                      );
                    })}
                  </div>
                )}

                {forgotPasswordStep === 'email' && (
                  <>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#24483A]">
                        {t('auth.forgot.emailLabel')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={handleFieldChange('email')}
                        placeholder="name@email.com"
                        autoComplete="email"
                        disabled={isSubmitting}
                        className={`w-full rounded-[16px] border bg-white px-4 py-4 text-base outline-none transition-colors focus:border-[#22C55E] disabled:cursor-not-allowed disabled:bg-[#F0F6F2] ${fieldErrors.email ? 'border-red-400' : 'border-[#B7C5BC]'}`}
                      />
                      {fieldErrors.email && (
                        <p className="mt-1.5 text-xs font-medium text-red-500">{fieldErrors.email}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleUseForgotPasswordMock}
                      className="flex w-full items-center justify-between gap-3 rounded-[8px] border border-[#D6EEDD] bg-[#F7FCF8] px-4 py-3 text-left transition-colors hover:border-[#2F855A] hover:bg-[#F0FBF3]"
                    >
                      <span>
                        <span className="block text-xs font-semibold uppercase text-[#789185]">
                          {t('auth.forgot.mockLabel')}
                        </span>
                        <span className="mt-1 block text-sm font-semibold text-[#103B2D]">
                          {forgotPasswordMockAccount.email}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-[8px] bg-white px-3 py-1.5 text-xs font-semibold text-[#2F855A]">
                        {t('auth.forgot.useMock')}
                      </span>
                    </button>
                  </>
                )}

                {forgotPasswordStep === 'otp' && (
                  <>
                    <div className="rounded-[8px] border border-[#D6EEDD] bg-[#F7FCF8] px-4 py-3 text-sm text-[#476458]">
                      {t('auth.forgot.sentTo')}{' '}
                      <span className="font-semibold text-[#103B2D]">{normalizeEmail(form.email)}</span>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#24483A]">
                        {t('auth.forgot.otpLabel')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={forgotPasswordForm.otp}
                        onChange={handleForgotPasswordFieldChange('otp')}
                        placeholder="123456"
                        autoComplete="one-time-code"
                        disabled={isSubmitting}
                        className={`w-full rounded-[16px] border bg-white px-4 py-4 text-center text-lg font-semibold tracking-[0.18em] outline-none transition-colors focus:border-[#22C55E] disabled:cursor-not-allowed disabled:bg-[#F0F6F2] ${fieldErrors.otp ? 'border-red-400' : 'border-[#B7C5BC]'}`}
                      />
                      {fieldErrors.otp && (
                        <p className="mt-1.5 text-xs font-medium text-red-500">{fieldErrors.otp}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleUseForgotPasswordMockOtp}
                      className="flex w-full items-center justify-between gap-3 rounded-[8px] border border-[#D6EEDD] bg-[#F7FCF8] px-4 py-3 text-left transition-colors hover:border-[#2F855A] hover:bg-[#F0FBF3]"
                    >
                      <span>
                        <span className="block text-xs font-semibold uppercase text-[#789185]">
                          {t('auth.forgot.mockOtpLabel')}
                        </span>
                        <span className="mt-1 block text-sm font-semibold text-[#103B2D]">
                          {forgotPasswordMockAccount.otp}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-[8px] bg-white px-3 py-1.5 text-xs font-semibold text-[#2F855A]">
                        {t('auth.forgot.useMock')}
                      </span>
                    </button>
                  </>
                )}

                {forgotPasswordStep === 'password' && (
                  <>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#24483A]">
                        {t('auth.forgot.newPasswordLabel')} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showResetPassword ? 'text' : 'password'}
                          value={forgotPasswordForm.newPassword}
                          onChange={handleForgotPasswordFieldChange('newPassword')}
                          placeholder="******"
                          autoComplete="new-password"
                          disabled={isSubmitting}
                          className={`w-full rounded-[16px] border bg-white px-4 py-4 pr-16 text-base outline-none transition-colors focus:border-[#22C55E] disabled:cursor-not-allowed disabled:bg-[#F0F6F2] ${fieldErrors.newPassword ? 'border-red-400' : 'border-[#B7C5BC]'}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowResetPassword((current) => !current)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#2F855A]"
                        >
                          {showResetPassword ? t('auth.forgot.hidePassword') : t('auth.forgot.showPassword')}
                        </button>
                      </div>
                      {fieldErrors.newPassword && (
                        <p className="mt-1.5 text-xs font-medium text-red-500">{fieldErrors.newPassword}</p>
                      )}
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#24483A]">
                        {t('auth.forgot.confirmPasswordLabel')} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showResetPasswordConfirm ? 'text' : 'password'}
                          value={forgotPasswordForm.confirmPassword}
                          onChange={handleForgotPasswordFieldChange('confirmPassword')}
                          placeholder="******"
                          autoComplete="new-password"
                          disabled={isSubmitting}
                          className={`w-full rounded-[16px] border bg-white px-4 py-4 pr-16 text-base outline-none transition-colors focus:border-[#22C55E] disabled:cursor-not-allowed disabled:bg-[#F0F6F2] ${fieldErrors.confirmPassword ? 'border-red-400' : 'border-[#B7C5BC]'}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowResetPasswordConfirm((current) => !current)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#2F855A]"
                        >
                          {showResetPasswordConfirm ? t('auth.forgot.hidePassword') : t('auth.forgot.showPassword')}
                        </button>
                      </div>
                      {fieldErrors.confirmPassword && (
                        <p className="mt-1.5 text-xs font-medium text-red-500">{fieldErrors.confirmPassword}</p>
                      )}
                    </div>

                  </>
                )}

                {forgotPasswordStep === 'done' && (
                  <div className="rounded-[8px] border border-[#BFE8CB] bg-[#F0FBF3] px-4 py-5 text-sm leading-6 text-[#1F6F43]">
                    <p className="font-semibold text-[#103B2D]">Đặt lại mật khẩu thành công</p>
                  </div>
                )}

                {forgotPasswordStep === 'otp' && (
                  <button
                    type="button"
                    onClick={() => {
                      setForgotPasswordStep('email');
                      setForgotPasswordForm(initialForgotPasswordFormState);
                      setSuccessMessage('');
                      setFieldErrors({});
                    }}
                    className="text-sm font-semibold text-[#2F855A]"
                  >
                    {t('auth.forgot.changeEmail')}
                  </button>
                )}

                {forgotPasswordStep === 'password' && (
                  <button
                    type="button"
                    onClick={() => {
                      setForgotPasswordStep('otp');
                      setSuccessMessage('');
                      setFieldErrors({});
                    }}
                    className="text-sm font-semibold text-[#2F855A]"
                  >
                    {t('auth.forgot.backToOtp')}
                  </button>
                )}
              </div>
            ) : mode === 'login' ? (
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

            {successMessage !== '' && (
              <div
                className="mt-5 rounded-[20px] border border-[#BFE8CB] bg-[#F0FBF3] px-4 py-3 text-sm text-[#1F6F43]"
                aria-live="polite"
              >
                {successMessage}
              </div>
            )}



            {isForgotPasswordPanel ? (
              <div className="mt-7">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-[8px] bg-[#0F5BD7] px-7 py-3.5 font-semibold text-white transition-colors hover:bg-[#0B4FC0] disabled:cursor-not-allowed disabled:bg-[#95B0A1]"
                >
                  {forgotPasswordSubmitLabel}
                </button>

                {forgotPasswordStep !== 'done' && (
                  <>
                    <div className="my-6 flex items-center gap-3 text-xs text-[#789185]">
                      <span className="h-px flex-1 bg-[#E2ECE6]" />
                      <span>{t('auth.forgot.or')}</span>
                      <span className="h-px flex-1 bg-[#E2ECE6]" />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleModeSwitch('login')}
                      className="w-full rounded-[8px] border border-[#D6EEDD] px-7 py-3 font-semibold text-[#2F855A] transition-colors hover:border-[#2F855A] hover:bg-[#F0FBF3]"
                    >
                      {t('auth.forgot.backToLogin')}
                    </button>
                  </>
                )}
              </div>
            ) : (
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
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
