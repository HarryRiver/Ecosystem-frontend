'use client';

import './i18n/config';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { clearAuthSession, restoreAuthSession, updateAccount, type AuthMode, type AuthUser } from '@/lib/auth';
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

  useEffect(() => {
    const session = restoreAuthSession();
    if (session && session.name.trim().toLowerCase() === 'hà đức lâm') {
      session.streetAddress = session.streetAddress || 'Số 9 An Thượng 5';
      session.district = session.district || 'Ngũ Hành Sơn';
      session.city = session.city || 'Thành phố Đà Nẵng';
    }
    setCurrentUser(session);
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

  const handleLogout = () => {
    clearAuthSession();
    setCurrentUser(null);
  };

  const handleBookingSubmit = async (payload: BookingSubmissionPayload) => {
    // Simulated delay to show loading state
    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (process.env.NODE_ENV !== 'production') {
      console.info('Booking payload ready for integration:', payload);
    }

    // Shared ID — dùng cho cả HistoryItem lẫn Order để 2 bên liên kết được
    const today = new Date();
    const randomSuffix = Math.floor(Math.random() * 9000) + 1000;
    const sharedId = `EC-${randomSuffix}`;
    const sharedCode = `EC${today.getFullYear().toString().slice(-2)}${(today.getMonth() + 1)
      .toString().padStart(2, '0')}${randomSuffix}`;
    const formattedDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1)
      .toString().padStart(2, '0')}/${today.getFullYear()}`;
    const isoNow = today.toISOString();

    // 1) Ghi vào STORAGE_KEYS.history — HistoryModal của user đọc từ đây
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

    // 2) Ghi vào STORAGE_KEYS.orders — Admin Dashboard đọc từ đây
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
