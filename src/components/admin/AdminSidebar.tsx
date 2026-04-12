'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { mapApiOrderToStoreOrder } from '../../lib/adminApiAdapters';
import { readOrders, STORAGE_KEYS, type Order, useSyncStore } from '../../lib/store';
import { getAdminOrders } from '../../services/admin.service';
import { cn } from '../../utils/cn';
import LanguageSwitcher from '../LanguageSwitcher';
import '../../i18n/config';
import { useTranslation } from 'react-i18next';

/* ─── SVG Icons ─────────────────────────────────────────────────── */
function IconUsers({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 0 0-4-4h-1M9 20H4v-2a4 4 0 0 1 4-4h2m3-4a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-6 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    </svg>
  );
}

function IconPricing({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l1.5-4.5 4.5-1.5-1.5 4.5-4.5 1.5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 9V7.5M9 16.5V15M15 16.5V15M9 9V7.5" />
    </svg>
  );
}

function IconOrders({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M9 16h4" />
    </svg>
  );
}

function IconLogout({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

/* ─── Nav Config ──────────────────────────────────────────────────── */
const navItems = [
  {
    href: '/admin/users',
    labelKey: 'admin.sidebar.nav.users',
    descKey: 'admin.sidebar.nav.usersDesc',
    icon: IconUsers,
    badge: null,
    color: 'from-emerald-500 to-teal-600',
    glow: 'shadow-emerald-200',
  },
  {
    href: '/admin/pricing',
    labelKey: 'admin.sidebar.nav.pricing',
    descKey: 'admin.sidebar.nav.pricingDesc',
    icon: IconPricing,
    badge: null,
    color: 'from-amber-500 to-orange-500',
    glow: 'shadow-amber-200',
  },
  {
    href: '/admin/orders',
    labelKey: 'admin.sidebar.nav.orders',
    descKey: 'admin.sidebar.nav.ordersDesc',
    icon: IconOrders,
    badge: null,
    color: 'from-violet-500 to-purple-600',
    glow: 'shadow-violet-200',
  },
];

/* ─── Props ───────────────────────────────────────────────────────── */
interface AdminSidebarProps {
  /** Task 7: onLogout thật — được truyền từ App.tsx qua AdminDashboard */
  onLogout?: () => void;
  adminName?: string;
  adminEmail?: string;
}

/* ─── Component ───────────────────────────────────────────────────── */
export default function AdminSidebar({
  onLogout,
  adminName = 'Admin',
  adminEmail = 'admin@ecocollect.vn',
}: AdminSidebarProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [orders, setOrders] = useSyncStore<Order[]>(STORAGE_KEYS.orders, readOrders());
  const processingOrdersCount = useMemo(
    () => orders.filter((order) => order.status === 'processing').length,
    [orders],
  );

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;

    getAdminOrders({ page: 1, limit: 200 })
      .then((response) => {
        if (cancelled) return;
        setOrders(response.items.map(mapApiOrderToStoreOrder));
      })
      .catch((error: unknown) => {
        console.error('[Admin] API failed:', error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <aside className="flex flex-col gap-3 xl:sticky xl:top-6 xl:self-start">
      {/* ── Brand card ── */}
      <div className="relative z-50 rounded-[28px] bg-[linear-gradient(135deg,_#0d2f23_0%,_#103B2D_60%,_#1a5240_100%)] p-5 shadow-[0_20px_60px_rgba(16,59,45,0.28)]">
        {/* Logo row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-1 min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#2F855A] shadow-[0_4px_16px_rgba(47,133,90,0.5)]">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5Z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold uppercase tracking-[0.2em] text-[#A7E8B6]">EcoCollect</p>
              <p className="truncate text-[10px] text-white/50">{t('admin.sidebar.brand', 'Admin Dashboard')}</p>
            </div>
          </div>
          <div className="hidden xl:block shrink-0">
            <LanguageSwitcher />
          </div>
        </div>

        {/* Divider */}
        <div className="my-4 h-px bg-white/8" />

        {/* Admin info */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2F855A]/60 text-sm font-bold text-white ring-2 ring-[#2F855A]/40">
            {adminName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{adminName}</p>
            <p className="truncate text-xs text-white/50">{adminEmail}</p>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20 xl:hidden"
          >
            {isMobileMenuOpen ? (
              <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className={cn("flex flex-col gap-3", isMobileMenuOpen ? "flex" : "hidden xl:flex")}>
      {/* ── Nav items ── */}
      <nav className="rounded-[28px] border border-[#D7ECDD] bg-white p-3 shadow-[0_12px_40px_rgba(16,59,45,0.07)]">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#6D877A]">
          {t('admin.sidebar.sections.operations', 'Nghiệp vụ')}
        </p>
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            const badge = item.href === '/admin/orders' ? processingOrdersCount : item.badge;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group relative flex items-center gap-3 overflow-hidden rounded-[20px] px-3 py-3 transition-all duration-200',
                  isActive ? 'bg-[#F3FBF5]' : 'hover:bg-[#F9FCFA]',
                )}
              >
                {/* Active indicator */}
                <span
                  className={cn(
                    'absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[#2F855A] transition-all duration-300',
                    isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-40',
                  )}
                />

                {/* Icon bubble */}
                <span
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-all duration-200',
                    isActive
                      ? `bg-gradient-to-br ${item.color} shadow-lg ${item.glow} text-white`
                      : 'bg-[#EEF8F0] text-[#2F855A] group-hover:bg-[#E0F5E6]',
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>

                {/* Text */}
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'text-sm font-semibold leading-tight',
                      isActive ? 'text-[#103B2D]' : 'text-[#476458] group-hover:text-[#103B2D]',
                    )}
                  >
                    {t(item.labelKey)}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-[#6D877A]">{t(item.descKey)}</p>
                </div>

                {/* Badge */}
                {badge !== null && (
                  <span
                    className={cn(
                      'flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-bold',
                      isActive
                        ? 'bg-[#103B2D] text-white'
                        : 'bg-[#E6FFEE] text-[#2F855A] group-hover:bg-[#103B2D] group-hover:text-white',
                    )}
                  >
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── Quick actions ── */}
      <div className="rounded-[28px] border border-[#D7ECDD] bg-white p-3 shadow-[0_12px_40px_rgba(16,59,45,0.07)]">
        <p className="mb-3 flex items-center justify-between px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#6D877A]">
          {t('admin.sidebar.sections.other', 'Khác')}
          <span className="xl:hidden">
            <LanguageSwitcher />
          </span>
        </p>
        <div className="space-y-1">
          <button
            type="button"
            onClick={onLogout}
            className="group flex w-full items-center gap-3 rounded-[20px] px-3 py-3 transition-all duration-200 hover:bg-red-50"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-400 transition-colors group-hover:bg-red-100">
              <IconLogout className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold text-[#476458] transition-colors group-hover:text-red-600">
              {t('admin.sidebar.actions.logout', 'Đăng xuất')}
            </span>
          </button>
        </div>
      </div>
      </div>
    </aside>
  );
}
