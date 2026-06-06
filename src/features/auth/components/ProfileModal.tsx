'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { type AuthUser } from '@/shared/lib/auth';
import { updateMe } from '@/features/auth/services/auth.service';
import { ApiError } from '@/shared/lib/apiClient';

interface Province {
  code: number;
  name: string;
}

interface District {
  code: number;
  name: string;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  onUpdateUser: (user: AuthUser) => void;
}

export default function ProfileModal({ isOpen, onClose, currentUser, onUpdateUser }: ProfileModalProps) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Local state for profile info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  // Address states
  const [streetAddress, setStreetAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setEmail(currentUser.email);
      setPhone(currentUser.phone || '');
      
      setStreetAddress(currentUser.streetAddress || '');
      setDistrict(currentUser.district || '');
      setCity(currentUser.city || '');
    }
    setErrorMessage('');
  }, [currentUser, isOpen]);

  // Fetch provinces immediately when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchProvinces = async () => {
      setIsLoadingProvinces(true);
      try {
        const response = await fetch('https://provinces.open-api.vn/api/p/');
        if (response.ok) {
          const data = await response.json();
          setProvinces(data);
        }
      } catch (error) {
        console.error('Error fetching provinces:', error);
      } finally {
        setIsLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, [isOpen]);

  // Fetch districts when city changes OR when starting to edit
  useEffect(() => {
    if (!city || !isOpen) {
      setDistricts([]);
      return;
    }

    const province = provinces.find((p) => p.name === city);
    if (!province) return;

    const fetchDistricts = async () => {
      setIsLoadingDistricts(true);
      try {
        const response = await fetch(`https://provinces.open-api.vn/api/p/${province.code}?depth=2`);
        if (response.ok) {
          const data = await response.json();
          const list = data.districts || [];
          setDistricts(list);
          
          // Re-sync district if we have a partial match (e.g. "Ngũ Hành Sơn" vs "Quận Ngũ Hành Sơn")
          if (district && isEditing) {
            const match = list.find((d: District) => d.name === district || d.name.includes(district));
            if (match) {
              setDistrict(match.name);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching districts:', error);
      } finally {
        setIsLoadingDistricts(false);
      }
    };
    fetchDistricts();
  }, [city, provinces, isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage('');

    try {
      if (!currentUser) return;

      const updatedProfile = await updateMe({
        full_name: name,
        phone,
        address: streetAddress,
        district,
        city,
      });

      onUpdateUser({
        ...currentUser,
        name: updatedProfile.full_name,
        email: updatedProfile.email,
        phone: updatedProfile.phone,
        role: updatedProfile.role,
        streetAddress: updatedProfile.address,
        district: updatedProfile.district,
        city: updatedProfile.city,
      });

      setIsEditing(false);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : 'Không thể lưu hồ sơ lúc này. Vui lòng thử lại.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to current data
    if (currentUser) {
      setName(currentUser.name);
      setPhone(currentUser.phone || '');
      setStreetAddress(currentUser.streetAddress || '');
      setDistrict(currentUser.district || '');
      setCity(currentUser.city || '');
    }
    setErrorMessage('');
    setIsEditing(false);
  };

  if (!isOpen || !currentUser) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Background Blur Overlay */}
      <div 
        className="absolute inset-0 bg-[#0B1511]/60 backdrop-blur-md transition-opacity duration-300" 
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-xl overflow-hidden rounded-[32px] bg-white shadow-[0_20px_80px_rgba(0,0,0,0.25)] animate-fadeInUp flex flex-col transform-gpu">
        {/* Header */}
        <div className="shrink-0 bg-[linear-gradient(135deg,#103B2D_0%,#18543F_55%,#1D6B4E_100%)] p-6 text-white text-center sm:text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8DE0A6] text-secondary text-xl font-bold">
                {name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <h2 className="text-xl font-bold">
                  {currentLang === 'vi' ? 'Hồ sơ người dùng' : (currentLang === 'sv' ? 'Användarprofil' : 'User Profile')}
                </h2>

              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto p-6 sm:p-8 space-y-6 [scrollbar-gutter:stable] contain-content transform-gpu">
          {errorMessage ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <div className="space-y-4">
            {/* Name Field (Read-only for demo) */}
            <div className="group rounded-2xl border border-[#D6EEDD] bg-[#F7FCF8] p-4 transition-all">
              <div className="flex items-center gap-3">
                <span className="text-xl">👤</span>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-[#24483A]/40 uppercase tracking-widest">{t('booking.labels.name')}</label>
                  <p className="text-base font-semibold text-secondary">{name}</p>
                </div>
              </div>
            </div>

            {/* Email Field (Read-only) */}
            <div className="group rounded-2xl border border-[#D6EEDD] bg-[#F7FCF8] p-4 transition-all">
              <div className="flex items-center gap-3">
                <span className="text-xl">📧</span>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-[#24483A]/40 uppercase tracking-widest">Email</label>
                  <p className="text-base font-semibold text-secondary">{email}</p>
                </div>
              </div>
            </div>

            {/* Phone Field */}
            <div className={`group rounded-2xl border p-4 transition-all ${isEditing ? 'border-[#22C55E] bg-white ring-4 ring-[#22C55E]/10' : 'border-[#D6EEDD] bg-[#F7FCF8]'}`}>
              <div className="flex items-center gap-3">
                <span className="text-xl">📞</span>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-[#24483A]/40 uppercase tracking-widest">{t('booking.labels.phone')}</label>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-transparent text-base font-semibold text-secondary outline-none"
                      placeholder="VD: 078XXXXXXX"
                    />
                  ) : (
                    <p className="text-base font-semibold text-secondary">{phone || 'Chưa cập nhật'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Address API Section */}
            <div className={`rounded-3xl border p-5 transition-all ${isEditing ? 'border-[#22C55E] bg-white ring-4 ring-[#22C55E]/10' : 'border-[#D6EEDD] bg-[#F7FCF8]'}`}>
              <div className="mb-4 flex items-center gap-3">
                <span className="text-xl">📍</span>
                <label className="block text-[10px] font-bold text-[#24483A]/40 uppercase tracking-widest">{t('booking.labels.address')}</label>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  {/* Street Address */}
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-[#24483A]/60">{t('booking.labels.address')} *</label>
                    <input 
                      type="text"
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      className="w-full rounded-xl border border-[#D6EEDD] bg-[#F7FCF8] px-4 py-3 text-sm font-medium text-secondary outline-none focus:border-[#22C55E]"
                      placeholder="Số nhà, tên đường..."
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {/* City */}
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-[#24483A]/60">{t('booking.labels.city')} *</label>
                      <select
                        value={city}
                        onChange={(e) => {
                          setCity(e.target.value);
                          setDistrict('');
                        }}
                        className="w-full rounded-xl border border-[#D6EEDD] bg-[#F7FCF8] px-4 py-3 text-sm font-medium text-secondary outline-none focus:border-[#22C55E] appearance-none"
                      >
                        <option value="">{isLoadingProvinces ? 'Đang tải...' : '--- Chọn Tỉnh ---'}</option>
                        {provinces.map((p) => (
                          <option key={p.code} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* District */}
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-[#24483A]/60">{t('booking.labels.district')} *</label>
                      <select
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        disabled={!city || isLoadingDistricts}
                        className="w-full rounded-xl border border-[#D6EEDD] bg-[#F7FCF8] px-4 py-3 text-sm font-medium text-secondary outline-none focus:border-[#22C55E] appearance-none disabled:opacity-50"
                      >
                        <option value="">{isLoadingDistricts ? 'Đang tải...' : '--- Chọn Quận ---'}</option>
                        {districts.map((d) => (
                          <option key={d.code} value={d.name}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-base font-semibold text-secondary">
                  {(!streetAddress && !district && !city) ? (currentLang === 'vi' ? 'Chưa cập nhật địa chỉ' : 'Address not updated') : `${streetAddress}${district ? `, ${district}` : ''}${city ? `, ${city}` : ''}`}
                </p>
              )}
            </div>
          </div>
          
          <div className="pt-2">
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="w-full rounded-2xl bg-secondary px-6 py-4 text-base font-bold text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-95"
              >
                Chỉnh sửa hồ sơ
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={handleCancel}
                  className="rounded-2xl border border-[#D6EEDD] bg-white px-6 py-4 text-sm font-bold text-[#24483A] transition-all hover:bg-gray-50 active:scale-95"
                >
                  {currentLang === 'vi' ? 'Hủy bỏ' : 'Cancel'}
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center justify-center rounded-2xl bg-[#22C55E] px-6 py-4 text-sm font-bold text-white transition-all shadow-[0_10px_30px_rgba(34,197,94,0.3)] hover:-translate-y-1 active:scale-95 disabled:opacity-70"
                >
                  {isSaving ? (
                    <svg className="h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    currentLang === 'vi' ? 'Lưu thay đổi' : 'Save Changes'
                  )}
                </button>
              </div>
            )}
            <p className="mt-6 text-center text-xs text-[#24483A]/40 font-medium">
              Thông tin được bảo mật mã hóa đầu cuối với công nghệ hiện đại
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}