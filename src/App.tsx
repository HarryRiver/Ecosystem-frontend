'use client';

import './i18n/config';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { clearAuthSession, updateAccount, type AuthMode, type AuthUser } from '@/lib/auth';
import {
  readHistory,
  appendHistory,
  readOrders,
  appendOrder,
  writeOrders,
  STORAGE_KEYS,
  useSyncStore,
  type HistoryItem,
  type Order,
} from '@/lib/store';
// ─── API Layer ────────────────────────────────────────────────────────────────────────────────
import { createOrder } from '@/services/orders.service';
import { logout as apiLogout, getMe } from '@/services/auth.service';
import { getToken, ApiError } from '@/lib/apiClient';
import type { HandlingMode } from '@/types/api';
import Header from './components/Header';
import Hero from './components/Hero';
import BrandStory from './components/BrandStory';
import HowItWorks from './components/HowItWorks';
import WasteTypes from './components/WasteTypes';
import Pricing from './components/Pricing';
import Reviews from './components/Reviews';
import Footer from './components/Footer';
import BookingModal, { type BookingSubmissionPayload, type BookingSubmissionItem } from './components/BookingModal';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import HistoryModal from './components/HistoryModal';
import AdminDashboard from './components/AdminDashboard';

interface BookingPrefill {
  address?: string;
  /** Task 3: lang-agnostic service key (e.g. 'furniture') instead of translated label */
  selectedWaste?: string;
}

function App() {
  const { i18n } = useTranslation();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [bookingPrefill, setBookingPrefill] = useState<BookingPrefill | null>(null);

  // History state lives in store — App only needs to write, HistoryModal reads
  const [, setHistoryItems] = useSyncStore<HistoryItem[]>(
    STORAGE_KEYS.history,
    readHistory(),
  );

  // Orders store — Admin reads this via useSyncStore too
  const [, setOrders] = useSyncStore<Order[]>(
    STORAGE_KEYS.orders,
    readOrders(),
  );

  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  useEffect(() => {
    document.body.style.overflow =
      isBookingOpen || isAuthOpen || isProfileOpen || isHistoryOpen ? 'hidden' : 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isBookingOpen, isAuthOpen, isProfileOpen, isHistoryOpen]);

  // ─── Restore session — có token thì verify với BE, không thì chỉ đọc localStorage ───
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setCurrentUser(null);
      return;
    }
    // Có token: gọi /me để xác minh và lấy user mới nhất
    getMe()
      .then((apiUser) => {
        const user: AuthUser = {
          name: apiUser.full_name,
          email: apiUser.email,
          phone: apiUser.phone,
          role: apiUser.role,
        };
        setCurrentUser(user);
      })
      .catch(() => {
        // Token hết hạn / không hợp lệ → logout
        clearAuthSession();
        setCurrentUser(null);
      });
  }, []);

  const openBooking = (prefill?: BookingPrefill) => {
    setBookingPrefill(prefill ?? null);
    setIsBookingOpen(true);
  };

  const closeBooking = () => setIsBookingOpen(false);

  const openAuth = (mode: AuthMode = 'login') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const closeAuth = () => setIsAuthOpen(false);

  const handleAuthSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setIsAuthOpen(false);
    // Admin: show admin dashboard (rendered conditionally below)
  };

  const handleUpdateUser = (user: AuthUser) => {
    setCurrentUser(user);
    updateAccount(user);
  };

  const handleLogout = async () => {
    // Gọi API logout để invalidate token phía BE (fire-and-forget)
    if (getToken()) {
      apiLogout().catch(() => { /* bỏ qua nếu mạng lỗi */ });
    }
    clearAuthSession();
    setCurrentUser(null);
  };

  const handleBookingSubmit = async (payload: BookingSubmissionPayload) => {
    // ─── Gọi API thật POST /orders ────────────────────────────────────────────────────
    // Tìm time_slot_id tương ứng với time slot văn bản khách chọn
    // (FE hiọn tại lưu text "08:00 - 10:00"; sau này cần lấy id thật từ useTimeSlots)
    const timeSlotIdFallback = payload.schedule.timeSlot;

    const beHandlingMode: HandlingMode =
      payload.services.handlingMode === 'outside' ? 'outside'
      : payload.services.handlingMode === 'stairs' ? 'stairs'
      : 'inside';

    const orderBody = {
      customer: {
        name: payload.customer.name,
        phone: payload.customer.phone,
        email: payload.customer.email,
      },
      address: {
        street: payload.customer.address.streetAddress,
        ward: '',
        district: payload.customer.address.district,
        province: payload.customer.address.city,
      },
      booking_date: payload.schedule.date,
      time_slot_id: timeSlotIdFallback,
      items: payload.services.items.map((item) => ({
        service_id: item.id,
        quantity: item.quantity,
        measurement_value: item.measurementValue,
        custom_item_name:
          item.id === 'custom' ? (item.name || undefined) : undefined,
      })),
      handling_mode: beHandlingMode,
      stairs_floors:
        beHandlingMode === 'stairs' ? (payload.services.stairsFloors ?? undefined) : undefined,
      payment_method:
        payload.payment.method === 'transfer' ? ('online' as const) : ('cash' as const),
      cash_policy_accepted: payload.payment.cashPolicyAccepted,
    };

    // Gọi BE thật — map lỗi thân thiện cho user
    let createdOrder: Awaited<ReturnType<typeof createOrder>>;
    try {
      createdOrder = await createOrder(orderBody);
    } catch (err) {
      if (err instanceof ApiError) {
        const errorMessages: Record<string, string> = {
          TIME_SLOT_FULL: 'Khung giờ này đã đầy. Vui lòng chọn giờ khác.',
          PHONE_BLACKLISTED: 'Số điện thoại này không thể đặt lịch. Liên hệ CSKH để biết thêm.',
          PREPAID_REQUIRED: 'Tài khoản yêu cầu thanh toán trước (online). Vui lòng chọn huyện khoản.',
          INVALID_DATE: 'Ngày đặt lịch không hợp lệ. Vui lòng chọn ngày khác.',
          SERVICE_NOT_FOUND: 'Một số dịch vụ không còn hoạt động. Vui lòng tải lại trang.',
        };
        const friendly = err.errorCode ? errorMessages[err.errorCode] : null;
        throw new Error(friendly ?? err.message ?? 'Đặt lịch thất bại. Vui lòng thử lại.');
      }
      throw new Error('Đặt lịch thất bại. Kiểm tra kết nối và thử lại.');
    }

    // ─── Cập nhật store cục bộ (fallback cho HistoryModal đọc) ───────────────
    const today = new Date();
    const formattedDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1)
      .toString().padStart(2, '0')}/${today.getFullYear()}`;
    const isoNow = today.toISOString();
    const sharedId = createdOrder.id;
    const sharedCode = createdOrder.code;

    const newHistoryItem: HistoryItem = {
      id: sharedId,
      date: formattedDate,
      status: 'in_progress',
      customerName: payload.customer.name,
      phone: payload.customer.phone,
      email: payload.customer.email,
      address: payload.customer.address.fullAddress,
      timeSlot: `${payload.schedule.date} • ${payload.schedule.timeSlot}`,
      handlingMode: payload.services.handlingLabel,
      items: payload.services.items.map((item: BookingSubmissionItem) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.estimatedLineTotal ?? 0,
      })),
      total: payload.services.total,
    };
    setHistoryItems((prev) => appendHistory(prev, newHistoryItem));

    const newOrder: Order = {
      id: sharedId,
      code: sharedCode,
      customerId: currentUser?.email ?? payload.customer.email,
      status: 'processing',
      items: payload.services.items.map((item: BookingSubmissionItem) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.estimatedLineTotal ?? 0,
      })),
      schedule: {
        date: payload.schedule.date,
        timeSlot: payload.schedule.timeSlot,
      },
      pricing: {
        subtotal: payload.services.subtotal,
        handlingFee: payload.services.handlingFee,
        total: payload.services.total,
        hasQuoteItems: payload.services.hasQuoteItems,
      },
      finalAmount: payload.services.total,
      notes: payload.customer.notes,
      attachments: {
        imageFileName: payload.attachments.imageFileName,
        imageFileSize: payload.attachments.imageFileSize,
        imageFileType: payload.attachments.imageFileType,
      },
      itemSummary: payload.services.items.map((i) => i.name).join(', '),
      paymentMethod: payload.payment.method === 'transfer' ? 'online' : 'cash',
      assignedStaff: 'Chưa phân công',
      selfAssessment: 'Khách chưa cung cấp.',
      priceAdjustment: 'Giữ nguyên giá',
      createdAt: isoNow,
      updatedAt: isoNow,
    };
    setOrders((prev) => {
      const next = appendOrder(prev, newOrder);
      writeOrders(next);
      return next;
    });
  };

  // Admin guard — render admin dashboard instead of landing page
  if (currentUser?.role === 'admin') {
    return (
      <>
        <AdminDashboard currentUser={currentUser} onLogout={handleLogout} />
        <AuthModal
          isOpen={isAuthOpen}
          mode={authMode}
          onClose={closeAuth}
          onModeChange={setAuthMode}
          onSuccess={handleAuthSuccess}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen">
      <Header
        currentUser={currentUser}
        onBookingClick={openBooking}
        onAuthClick={openAuth}
        onLogout={handleLogout}
        onProfileClick={() => setIsProfileOpen(true)}
        onHistoryClick={() => setIsHistoryOpen(true)}
      />
      <Hero currentUser={currentUser} onAuthClick={openAuth} onBookingClick={openBooking} />
      <BrandStory onBookingClick={openBooking} />
      <HowItWorks onBookingClick={openBooking} />
      <WasteTypes onBookingClick={openBooking} />
      <Pricing onBookingClick={openBooking} />
      <Reviews currentUser={currentUser} />
      <Footer onBookingClick={openBooking} />
      <BookingModal
        currentUser={currentUser}
        isOpen={isBookingOpen}
        onAuthClick={openAuth}
        onClose={closeBooking}
        onSubmit={handleBookingSubmit}
        prefill={bookingPrefill}
      />
      <AuthModal
        isOpen={isAuthOpen}
        mode={authMode}
        onClose={closeAuth}
        onModeChange={setAuthMode}
        onSuccess={handleAuthSuccess}
      />
      <ProfileModal
        currentUser={currentUser}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onUpdateUser={handleUpdateUser}
      />
      <HistoryModal
        currentUser={currentUser}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
      {/* Floating Book Button */}
      <button
        onClick={() => openBooking()}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#103B2D] text-white shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl md:hidden"
        aria-label="Đặt lịch ngay"
      >
        <span className="text-2xl">📅</span>
      </button>
    </div>
  );
}

export default App;
