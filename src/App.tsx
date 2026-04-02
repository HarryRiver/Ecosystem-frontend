'use client';

import { useEffect, useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import BrandStory from './components/BrandStory';
import HowItWorks from './components/HowItWorks';
import WasteTypes from './components/WasteTypes';
import Pricing from './components/Pricing';
import Reviews from './components/Reviews';
import Footer from './components/Footer';
import BookingModal from './components/BookingModal';
import AuthModal, { type AuthMode, type AuthUser } from './components/AuthModal';

interface BookingPrefill {
  address?: string;
  handlingGoal?: string;
  selectedWaste?: string;
}

function App() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [bookingPrefill, setBookingPrefill] = useState<BookingPrefill | null>(null);

  useEffect(() => {
    document.body.style.overflow = isBookingOpen || isAuthOpen ? 'hidden' : 'auto';

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isBookingOpen, isAuthOpen]);

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

  return (
    <div className="min-h-screen">
      <Header
        currentUser={currentUser}
        onBookingClick={openBooking}
        onAuthClick={openAuth}
        onLogout={() => setCurrentUser(null)}
      />
      <Hero currentUser={currentUser} onAuthClick={openAuth} onBookingClick={openBooking} />
      <BrandStory onBookingClick={openBooking} />
      <HowItWorks onBookingClick={openBooking} />
      <WasteTypes onBookingClick={openBooking} />
      <Pricing onBookingClick={openBooking} />
      <Reviews />
      <Footer onBookingClick={openBooking} />
      <BookingModal
        currentUser={currentUser}
        isOpen={isBookingOpen}
        onAuthClick={openAuth}
        onClose={closeBooking}
        prefill={bookingPrefill}
      />
      <AuthModal
        isOpen={isAuthOpen}
        mode={authMode}
        onClose={closeAuth}
        onModeChange={setAuthMode}
        onSuccess={handleAuthSuccess}
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
