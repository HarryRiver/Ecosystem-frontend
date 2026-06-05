import type { ReactNode } from 'react';
import AdminSidebar from '../../src/features/admin/components/admin/AdminSidebar';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[linear-gradient(160deg,_#EEF8F0_0%,_#F9FCFA_40%,_#FFFFFF_100%)]">
      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col xl:flex-row gap-6 xl:items-start">
          {/* ── Left sidebar ── */}
          <div className="w-full shrink-0 xl:w-[280px]">
            <AdminSidebar />
          </div>

          {/* ── Main content ── */}
          <div className="min-w-0 flex-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
