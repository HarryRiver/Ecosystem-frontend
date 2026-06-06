'use client';

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { type AuthMode, type AuthUser } from '@/shared/lib/auth';
import { 
  login as apiLogin, 
  register as apiRegister,
  sendOtp as apiSendOtp,
  verifyOtp as apiVerifyOtp,
  requestPasswordReset as apiRequestReset,
  changePassword as apiChangePassword
} from '@/features/auth/services/auth.service';
import { ApiError } from '@/shared/lib/apiClient';

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

type AuthPanel = 'credentials' | 'forgotPassword' | 'registerOtp';
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
// Phân đoạn OTP đã chuyển sang dùng API thật


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
  const isRegisterOtpPanel = activePanel === 'registerOtp';


  const forgotPasswordDescription =
    isRegisterOtpPanel
      ? `Vui lòng nhập mã OTP đã được gửi đến email ${form.email} để hoàn tất đăng ký.`
      : forgotPasswordStep === 'otp'
        ? t('auth.forgot.otpDescription')
        : forgotPasswordStep === 'password'
          ? t('auth.forgot.passwordDescription')
          : forgotPasswordStep === 'done'
            ? ''
            : t('auth.forgot.description');

  const forgotPasswordSubmitLabel =
    isRegisterOtpPanel
      ? 'Xác thực đăng ký'
      : forgotPasswordStep === 'otp'
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
        nextValue = nextValue.replace(/\D/g, '').slice(0, 6);
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
        }

        if (Object.keys(errors).length > 0) {
          setFieldErrors(errors);
          setSuccessMessage('');
          return;
        }

        setFieldErrors({});
        setErrorMessage('');
        setIsSubmitting(true);
        try {
          await apiRequestReset({ email: normalizedEmail });
          setSuccessMessage(t('auth.forgot.otpSent'));
          setForgotPasswordStep('otp');
        } catch (err) {
          setErrorMessage(err instanceof ApiError ? err.message : 'Không thể gửi yêu cầu reset mật khẩu.');
        } finally {
          setIsSubmitting(false);
        }
        return;
      }

      if (forgotPasswordStep === 'otp') {
        const otpCode = forgotPasswordForm.otp.trim();
        if (!otpCode) {
          errors.otp = t('auth.forgot.otpRequired');
        } else if (otpCode.length < 6) {
          errors.otp = 'Mã OTP không hợp lệ';
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
        setIsSubmitting(true);
        try {
          await apiChangePassword({
            email: normalizedEmail,
            otpCode: forgotPasswordForm.otp.trim(),
            newPassword: forgotPasswordForm.newPassword.trim()
          });
          setForgotPasswordStep('done');
        } catch (err) {
          setErrorMessage(err instanceof ApiError ? err.message : 'Không thể thay đổi mật khẩu.');
        } finally {
          setIsSubmitting(false);
        }
        return;
      }

      if (forgotPasswordStep === 'done') {
        handleModeSwitch('login');
        setSuccessMessage('');
        return;
      }
    }

    // New logic for registerOtp panel
    if (activePanel === 'registerOtp') {
      const otpCode = forgotPasswordForm.otp.trim();
      if (!otpCode) {
        setFieldErrors({ otp: 'Vui lòng nhập mã OTP' });
        return;
      }
      setIsSubmitting(true);
      try {
        const email = normalizeEmail(form.email);
        await apiVerifyOtp({ email, code: otpCode });
        setSuccessMessage('Xác thực tài khoản thành công! Bây giờ bạn có thể đăng nhập.');
        // Chuyển sang mode login
        handleModeSwitch('login');
      } catch (err) {
        setErrorMessage(err instanceof ApiError ? err.message : 'Xác thực không thành công.');
      } finally {
        setIsSubmitting(false);
      }
      return;
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

        if (payload.user.status === 'unverified') {
          // Gửi mã OTP
          await apiSendOtp({ email: payload.user.email });
          setSuccessMessage(`Đăng ký thành công! Một mã OTP đã được gửi đến ${payload.user.email}`);
          setActivePanel('registerOtp');
        } else {
          // Trường hợp hãn hữu: BE tự xác thực luôn
          const user: AuthUser = {
            name: payload.user.full_name,
            email: payload.user.email,
            phone: payload.user.phone,
            role: payload.user.role,
          };
          resetForm();
          onSuccess(user);
        }
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
    <div className="fixed inset-0 z-130 flex items-center justify-center bg-overlay/72 p-4 backdrop-blur-md">
      <div className="grid w-full max-w-5xl max-h-[calc(100dvh-2rem)] overflow-y-auto overflow-x-hidden rounded-[32px] bg-white shadow-[0_32px_120px_rgba(0,0,0,0.28)] lg:grid-cols-[0.94fr_1.06fr]">
        <aside className="hidden lg:block bg-auth-aside p-7 text-white">
          <div className="inline-flex items-center rounded-full border border-white/12 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-light">
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
              <h3 className="text-3xl font-bold text-secondary">
                {isRegisterOtpPanel
                  ? 'Xác thực đăng ký'
                  : isForgotPasswordPanel
                    ? t('auth.forgot.title')
                    : mode === 'login'
                      ? t('auth.login.title')
                      : t('auth.register.title')}
              </h3>
              {(isForgotPasswordPanel || isRegisterOtpPanel) && (
                <p className="mt-3 max-w-md text-sm leading-6 text-sidebar-text">
                  {forgotPasswordDescription}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EEF6F0] text-secondary transition-colors hover:bg-[#E2F0E6]"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {!isForgotPasswordPanel && !isRegisterOtpPanel && (
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
                    mode === item.key ? 'bg-secondary text-white' : 'text-sidebar-text'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}

          <form className={(isForgotPasswordPanel || isRegisterOtpPanel) ? 'mt-6' : 'mt-7'} onSubmit={handleSubmit} noValidate>
            {isForgotPasswordPanel ? (
              <div className="space-y-5">
                {forgotPasswordStep !== 'done' && (
                  <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-form-helper">
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
                              ? 'border-primary bg-[#F0FBF3] text-secondary'
                              : isCompletedStep
                                ? 'border-[#BFE8CB] bg-white text-primary'
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
                      <label className="mb-2 block text-sm font-semibold text-text-dark">
                        {t('auth.forgot.emailLabel')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={handleFieldChange('email')}
                        placeholder="name@email.com"
                        autoComplete="email"
                        disabled={isSubmitting}
                        className={`w-full rounded-[16px] border bg-white px-4 py-4 text-base outline-none transition-colors focus:border-focus disabled:cursor-not-allowed disabled:bg-[#F0F6F2] ${fieldErrors.email ? 'border-red-400' : 'border-[#B7C5BC]'}`}
                      />
                      {fieldErrors.email && (
                        <p className="mt-1.5 text-xs font-medium text-red-500">{fieldErrors.email}</p>
                      )}
                    </div>

                  </>
                )}

                {forgotPasswordStep === 'otp' && (
                  <>
                    <div className="rounded-[8px] border border-border-light bg-bg-light px-4 py-3 text-sm text-sidebar-text">
                      {t('auth.forgot.sentTo')}{' '}
                      <span className="font-semibold text-secondary">{normalizeEmail(form.email)}</span>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-text-dark">
                        {t('auth.forgot.otpLabel')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={forgotPasswordForm.otp}
                        onChange={handleForgotPasswordFieldChange('otp')}
                        placeholder="000000"
                        autoComplete="one-time-code"
                        disabled={isSubmitting}
                        className={`w-full rounded-[16px] border bg-white px-4 py-4 text-center text-lg font-semibold tracking-[0.18em] outline-none transition-colors focus:border-focus disabled:cursor-not-allowed disabled:bg-[#F0F6F2] ${fieldErrors.otp ? 'border-red-400' : 'border-[#B7C5BC]'}`}
                      />
                      {fieldErrors.otp && (
                        <p className="mt-1.5 text-xs font-medium text-red-500">{fieldErrors.otp}</p>
                      )}
                    </div>

                  </>
                )}

                {forgotPasswordStep === 'password' && (
                  <>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-text-dark">
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
                          className={`w-full rounded-[16px] border bg-white px-4 py-4 pr-16 text-base outline-none transition-colors focus:border-focus disabled:cursor-not-allowed disabled:bg-[#F0F6F2] ${fieldErrors.newPassword ? 'border-red-400' : 'border-[#B7C5BC]'}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowResetPassword((current) => !current)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-primary"
                        >
                          {showResetPassword ? t('auth.forgot.hidePassword') : t('auth.forgot.showPassword')}
                        </button>
                      </div>
                      {fieldErrors.newPassword && (
                        <p className="mt-1.5 text-xs font-medium text-red-500">{fieldErrors.newPassword}</p>
                      )}
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-text-dark">
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
                          className={`w-full rounded-[16px] border bg-white px-4 py-4 pr-16 text-base outline-none transition-colors focus:border-focus disabled:cursor-not-allowed disabled:bg-[#F0F6F2] ${fieldErrors.confirmPassword ? 'border-red-400' : 'border-[#B7C5BC]'}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowResetPasswordConfirm((current) => !current)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-primary"
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
                    <p className="font-semibold text-secondary">{t('auth.forgot.doneTitle')}</p>
                    <p className="mt-2">{t('auth.forgot.doneCopy')}</p>
                  </div>
                )}

                {(forgotPasswordStep === 'otp' || isRegisterOtpPanel) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (isRegisterOtpPanel) {
                        handleModeSwitch('register');
                      } else {
                        setForgotPasswordStep('email');
                        setForgotPasswordForm(initialForgotPasswordFormState);
                      }
                      setSuccessMessage('');
                      setFieldErrors({});
                    }}
                    className="text-sm font-semibold text-primary"
                  >
                    {isRegisterOtpPanel ? 'Thay đổi thông tin đăng ký' : t('auth.forgot.changeEmail')}
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
                    className="text-sm font-semibold text-primary"
                  >
                    {t('auth.forgot.backToOtp')}
                  </button>
                )}
              </div>
            ) : isRegisterOtpPanel ? (
              <div className="space-y-5">
                <div className="rounded-[8px] border border-border-light bg-bg-light px-4 py-3 text-sm text-sidebar-text">
                  Mã OTP đã được gửi đến email <span className="font-semibold text-secondary">{form.email}</span>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-text-dark">
                    Mã xác thực OTP <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={forgotPasswordForm.otp}
                    onChange={handleForgotPasswordFieldChange('otp')}
                    placeholder="000000"
                    disabled={isSubmitting}
                    className={`w-full rounded-[16px] border bg-white px-4 py-4 text-center text-lg font-semibold tracking-[0.18em] outline-none transition-colors focus:border-focus ${fieldErrors.otp ? 'border-red-400' : 'border-[#B7C5BC]'}`}
                  />
                  {fieldErrors.otp && (
                    <p className="mt-1.5 text-xs font-medium text-red-500">{fieldErrors.otp}</p>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setSuccessMessage('');
                      apiSendOtp({ email: form.email }).then(() => setSuccessMessage('Mã OTP mới đã được gửi.'));
                    }}
                    className="font-medium text-primary"
                  >
                    Gửi lại mã OTP
                  </button>
                </div>
              </div>
            ) : mode === 'login' ? (
              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-text-dark">
                    {t('auth.login.emailLabel')} <span className="font-normal text-form-helper">(hoặc Số điện thoại)</span>
                  </label>
                  <input
                    type="text"
                    value={form.email}
                    onChange={handleFieldChange('email')}
                    placeholder="email@example.com hoặc 09xxxxxxxx"
                    autoComplete="username"
                    disabled={isSubmitting}
                    className={`w-full rounded-[24px] border bg-bg-light px-4 py-4 text-base outline-none transition-colors focus:border-focus disabled:cursor-not-allowed disabled:bg-[#F0F6F2] ${fieldErrors.email ? 'border-red-400' : 'border-border-light'}`}
                  />
                  {fieldErrors.email && (
                    <p className="mt-1.5 text-xs font-medium text-red-500">{fieldErrors.email}</p>
                  )}
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label className="text-sm font-semibold text-text-dark">{t('auth.login.passwordLabel')}</label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-sm font-medium text-primary"
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
                      className={`w-full rounded-[24px] border bg-bg-light px-4 py-4 pr-12 text-base outline-none transition-colors focus:border-focus disabled:cursor-not-allowed disabled:bg-[#F0F6F2] ${fieldErrors.password ? 'border-red-400' : 'border-border-light'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-placeholder hover:text-primary transition-colors"
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
                  <label className="mb-2 block text-sm font-semibold text-text-dark">{t('auth.register.nameLabel')}</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={handleFieldChange('name')}
                    placeholder="Name"
                    autoComplete="name"
                    disabled={isSubmitting}
                    className={`w-full rounded-[24px] border bg-bg-light px-4 py-4 text-base outline-none transition-colors focus:border-focus disabled:cursor-not-allowed disabled:bg-[#F0F6F2] ${fieldErrors.name ? 'border-red-400' : 'border-border-light'}`}
                  />
                  {fieldErrors.name && (
                    <p className="mt-1.5 text-xs font-medium text-red-500">{fieldErrors.name}</p>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-text-dark">{t('auth.register.phoneLabel')}</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={handleFieldChange('phone')}
                      placeholder="0901234567"
                      autoComplete="tel"
                      disabled={isSubmitting}
                      className={`w-full rounded-[24px] border bg-bg-light px-4 py-4 text-base outline-none transition-colors focus:border-focus disabled:cursor-not-allowed disabled:bg-[#F0F6F2] ${fieldErrors.phone ? 'border-red-400' : 'border-border-light'}`}
                    />
                    {fieldErrors.phone && (
                      <p className="mt-1.5 text-xs font-medium text-red-500">{fieldErrors.phone}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-text-dark">{t('auth.register.emailLabel')}</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={handleFieldChange('email')}
                      placeholder="ban@company.com"
                      autoComplete="email"
                      disabled={isSubmitting}
                      className={`w-full rounded-[24px] border bg-bg-light px-4 py-4 text-base outline-none transition-colors focus:border-focus disabled:cursor-not-allowed disabled:bg-[#F0F6F2] ${fieldErrors.email ? 'border-red-400' : 'border-border-light'}`}
                    />
                    {fieldErrors.email && (
                      <p className="mt-1.5 text-xs font-medium text-red-500">{fieldErrors.email}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-text-dark">{t('auth.register.passwordLabel')}</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={handleFieldChange('password')}
                      placeholder="......"
                      autoComplete="new-password"
                      disabled={isSubmitting}
                      className={`w-full rounded-[24px] border bg-bg-light px-4 py-4 pr-12 text-base outline-none transition-colors focus:border-focus disabled:cursor-not-allowed disabled:bg-[#F0F6F2] ${fieldErrors.password ? 'border-red-400' : 'border-border-light'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-placeholder hover:text-primary transition-colors"
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
                <label className="flex items-start gap-3 rounded-[24px] border border-border-light bg-sidebar-hover-bg p-4 text-sm text-sidebar-text">
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
                  className="w-full rounded-[8px] bg-[#0f5bd7] px-7 py-3.5 font-semibold text-white transition-colors hover:bg-[#0b4fc0] disabled:cursor-not-allowed disabled:bg-[#95b0a1] flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {t('common.loading')}
                    </>
                  ) : (
                    forgotPasswordSubmitLabel
                  )}
                </button>

                {forgotPasswordStep !== 'done' && (
                  <>
                    <div className="my-6 flex items-center gap-3 text-xs text-form-helper">
                      <span className="h-px flex-1 bg-[#E2ECE6]" />
                      <span>{t('auth.forgot.or')}</span>
                      <span className="h-px flex-1 bg-[#E2ECE6]" />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleModeSwitch('login')}
                      className="w-full rounded-[8px] border border-border-light px-7 py-3 font-semibold text-primary transition-colors hover:border-primary hover:bg-[#F0FBF3]"
                    >
                      {t('auth.forgot.backToLogin')}
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-form-helper">
                  {mode === 'login' ? t('auth.login.switch').split('?')[0] + '?' : t('auth.register.switch').split('?')[0] + '?'}
                  <button
                    type="button"
                    onClick={() => handleModeSwitch(mode === 'login' ? 'register' : 'login')}
                    className="ml-2 font-semibold text-primary"
                  >
                    {mode === 'login' ? t('auth.login.switch').split('?')[1] : t('auth.register.switch').split('?')[1]}
                  </button>
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-full bg-secondary px-7 py-3 font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-[#95B0A1] flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {t('common.loading')}
                    </>
                  ) : mode === 'login' ? (
                    t('auth.login.submit')
                  ) : (
                    t('auth.register.submit')
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
