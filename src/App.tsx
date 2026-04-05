'use client';

import './i18n/config';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { clearAuthSession, restoreAuthSession, persistAuthSession, type AuthMode, type AuthUser } from '@/lib/auth';
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
import HistoryModal, { type HistoryItem } from './components/HistoryModal';

interface BookingPrefill {
  address?: string;
  handlingGoal?: string;
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
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);

  // Persistence logic for history
  useEffect(() => {
    const savedHistory = localStorage.getItem('ecocollect_history');
    const mockHistory: HistoryItem[] = [
      {
        id: 'EC-9482',
        date: '03/04/2026',
        status: 'completed',
        customerName: 'Hà Đức Lâm',
        phone: '0784514373',
        email: 'haduclam2005@gmail.com',
        address: 'Số 9 An Thượng 5, Quận Ngũ Hành Sơn, Đà Nẵng',
        timeSlot: 'Th 2, 13 thg 4 • 12:00 - 14:00',
        handlingMode: 'Vào tận nhà bê đồ',
        items: [
          { name: 'Sofa đơn', quantity: 2, price: 300000 },
          { name: 'Tủ quần áo', quantity: 1, price: 180000 },
        ],
        total: 780000,
      },
      {
        id: 'EC-8551',
        date: '01/04/2026',
        status: 'completed',
        customerName: 'Hà Đức Lâm',
        phone: '0784514373',
        email: 'haduclam2005@gmail.com',
        address: 'Số 9 An Thượng 5, Quận Ngũ Hành Sơn, Đà Nẵng',
        timeSlot: 'Th 6, 10 thg 4 • 08:00 - 10:00',
        handlingMode: 'Để ngoài cửa',
        items: [
          { name: 'Máy giặt', quantity: 1, price: 150000 },
          { name: 'Tủ bếp', quantity: 1, price: 120000 },
        ],
        total: 270000,
      },
    ];

    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        // Merge saved items with mock items, avoiding duplicates by ID
        const combined = [...parsed];
        mockHistory.forEach(mock => {
          if (!combined.find(item => item.id === mock.id)) {
            combined.push(mock);
          }
        });
        setHistoryItems(combined);
      } catch (e) {
        setHistoryItems(mockHistory);
      }
    } else {
      setHistoryItems(mockHistory);
    }
  }, []);

  useEffect(() => {
    if (historyItems.length > 0) {
      localStorage.setItem('ecocollect_history', JSON.stringify(historyItems));
    }
  }, [historyItems]);

  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  useEffect(() => {
    document.body.style.overflow = isBookingOpen || isAuthOpen || isProfileOpen || isHistoryOpen ? 'hidden' : 'auto';

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

  const closeBooking = () => {
    setIsBookingOpen(false);
  };

  const openAuth = (mode: AuthMode = 'login') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const closeAuth = () => {
    setIsAuthOpen(false);
  };

  const handleAuthSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setIsAuthOpen(false);
  };

  const handleUpdateUser = (user: AuthUser) => {
    setCurrentUser(user);
    persistAuthSession(user);
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

    // Add to local history for session tracking
    const today = new Date();
    const formattedDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
    
    const newItem: HistoryItem = {
      id: `EC-${Math.floor(Math.random() * 9000) + 1000}`,
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
        price: item.estimatedLineTotal ?? 0
      })),
      total: payload.services.total,
    };

    setHistoryItems(prev => [newItem, ...prev]);
  };

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
        historyItems={historyItems}
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
