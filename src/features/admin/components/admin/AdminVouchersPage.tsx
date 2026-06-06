'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/shared/utils/cn';
import { currency } from '@/shared/data/adminDashboardMock';
import {
  getAdminVouchers,
  createAdminVoucher,
  updateAdminVoucher,
} from '@/features/admin/services/admin.service';
import type { Voucher, CreateVoucherBody } from '@/shared/types/api';

/* ─── Modal Components ─────────────────────────────────────────────────── */
function CreateVoucherModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (voucher: Voucher) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Default new voucher state
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const [formData, setFormData] = useState<CreateVoucherBody>({
    code: '',
    type: 'fixed',
    value: 50000,
    min_order_value: 100000,
    usage_limit: 100,
    per_user_limit: 100,
    start_date: new Date().toISOString().slice(0, 16),
    end_date: nextMonth.toISOString().slice(0, 16),
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await createAdminVoucher({
        ...formData,
        per_user_limit: formData.per_user_limit ?? formData.usage_limit,
      });
      onSuccess(result);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tạo khuyến mãi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-secondary/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md animate-scaleUp rounded-[28px] bg-white p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-bold text-secondary">Mã Khuyến Mãi Mới</h3>
          <button
            title="Đóng"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-active-bg text-primary transition-colors hover:bg-sidebar-bubble-hover"
          >
            <svg className="h-4 w-4" fill="none" strokeWidth={2} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-sidebar-muted">Mã Code</label>
            <input
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="VD: GIAMGIA10"
              className="w-full rounded-xl border border-border-light bg-bg-light px-4 py-3 text-sm font-semibold text-secondary outline-none transition-colors focus:border-primary focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-sidebar-muted">Loại</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full rounded-xl border border-border-light bg-bg-light px-4 py-3 text-sm font-semibold text-secondary outline-none focus:border-primary focus:bg-white"
              >
                <option value="fixed">Tiền mặt (đ)</option>
                <option value="percent">Phần trăm (%)</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-sidebar-muted">Giá trị giảm</label>
              <input
                required
                type="number"
                min={0}
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                className="w-full rounded-xl border border-border-light bg-bg-light px-4 py-3 text-sm font-semibold text-secondary outline-none focus:border-primary focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-sidebar-muted">Đơn tối thiểu</label>
              <input
                required
                type="number"
                min={0}
                value={formData.min_order_value}
                onChange={(e) => setFormData({ ...formData, min_order_value: Number(e.target.value) })}
                className="w-full rounded-xl border border-border-light bg-bg-light px-4 py-3 text-sm font-semibold text-secondary outline-none focus:border-primary focus:bg-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-sidebar-muted">Tổng lượt dùng</label>
              <input
                required
                type="number"
                min={0}
                value={formData.usage_limit}
                onChange={(e) => {
                  const usageLimit = Number(e.target.value);
                  setFormData({
                    ...formData,
                    usage_limit: usageLimit,
                    per_user_limit: formData.per_user_limit ?? usageLimit,
                  });
                }}
                className="w-full rounded-xl border border-border-light bg-bg-light px-4 py-3 text-sm font-semibold text-secondary outline-none focus:border-primary focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-sidebar-muted">Mỗi khách tối đa</label>
            <input
              required
              type="number"
              min={0}
              value={formData.per_user_limit ?? formData.usage_limit}
              onChange={(e) => setFormData({ ...formData, per_user_limit: Number(e.target.value) })}
              className="w-full rounded-xl border border-border-light bg-bg-light px-4 py-3 text-sm font-semibold text-secondary outline-none focus:border-primary focus:bg-white"
            />
            <p className="mt-1 text-xs font-medium text-form-helper">Nhập 0 nếu không giới hạn theo từng khách.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-sidebar-muted">Từ ngày</label>
              <input
                type="datetime-local"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full rounded-xl border border-border-light bg-bg-light px-4 py-3 text-sm font-semibold text-secondary outline-none focus:border-primary focus:bg-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-sidebar-muted">Đến ngày</label>
              <input
                type="datetime-local"
                required
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full rounded-xl border border-border-light bg-bg-light px-4 py-3 text-sm font-semibold text-secondary outline-none focus:border-primary focus:bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-primary px-6 py-4 text-center font-bold text-white transition-all hover:bg-primary-hover disabled:opacity-50"
          >
            {loading ? 'Đang tạo...' : 'Lưu và phát hành thẻ'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────────── */
export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAdminVouchers()
      .then((data) => {
        if (!cancelled) {
          setVouchers(data || []);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError('Không thể tải danh sách khuyến mãi dồ API lỗi.');
          setIsLoading(false);
          console.error(err);
        }
      });
    return () => { cancelled = true; };
  }, []);

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    // Optimistic
    setVouchers((prev) =>
      prev.map((v) => (v.id === id ? { ...v, active: !currentStatus } : v))
    );
    try {
      await updateAdminVoucher(id, { active: !currentStatus });
    } catch (err) {
      alert('Không thể cập nhật trạng thái');
      // Revert optimistic
      setVouchers((prev) =>
        prev.map((v) => (v.id === id ? { ...v, active: currentStatus } : v))
      );
    }
  };

  const activeCount = vouchers.filter((v) => v.active).length;
  const expiredCount = vouchers.filter((v) => !v.active).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary">Quản lý Vouchers</h1>
          <p className="mt-1 text-sm text-sidebar-muted">Tạo và kiểm soát các chiến dịch mã giảm giá</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-primary hover:shadow-lg"
        >
          <svg className="h-5 w-5" fill="none" strokeWidth={2} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Tạo mã mới
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[24px] bg-white p-5 shadow-[0_8px_30px_rgba(16,59,45,0.05)] border border-border-light">
          <p className="text-[11px] font-bold uppercase tracking-wider text-admin-muted">Tổng mã hệ thống</p>
          <p className="mt-2 text-3xl font-bold text-secondary">{vouchers.length}</p>
        </div>
        <div className="rounded-[24px] bg-white p-5 shadow-[0_8px_30px_rgba(16,59,45,0.05)] border border-border-light">
          <p className="text-[11px] font-bold uppercase tracking-wider text-admin-muted">Đang hoạt động</p>
          <p className="mt-2 text-3xl font-bold text-primary">{activeCount}</p>
        </div>
        <div className="rounded-[24px] bg-white p-5 shadow-[0_8px_30px_rgba(16,59,45,0.05)] border border-border-light">
          <p className="text-[11px] font-bold uppercase tracking-wider text-admin-muted">Đã hết hạn/tạm dừng</p>
          <p className="mt-2 text-3xl font-bold text-amber-500">{expiredCount}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-[24px] border border-border-light bg-white py-12 text-center shadow-[0_8px_30px_rgba(16,59,45,0.05)]">
          <p className="text-sm font-semibold text-admin-muted">Đang tải dữ liệu voucher...</p>
        </div>
      ) : error ? (
        <div className="rounded-[24px] border border-red-200 bg-red-50 p-6 text-red-600 font-semibold text-center">
          {error}
        </div>
      ) : (
        <div className="rounded-[24px] border border-border-light bg-white shadow-[0_8px_30px_rgba(16,59,45,0.05)]">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-border-light">
                  <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-admin-muted">Bản ghi</th>
                  <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-admin-muted">Giảm giá</th>
                  <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-admin-muted">Hiệu lực</th>
                  <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-admin-muted">Giới hạn sử dụng</th>
                  <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-admin-muted">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {vouchers.map((v, i) => (
                  <tr key={v.id} className={cn('border-b border-border-light transition-colors', i % 2 === 1 && 'bg-sidebar-hover-bg')}>
                    <td className="px-5 py-4">
                      <p className="text-base font-bold text-secondary uppercase tracking-wide bg-sidebar-bubble-bg w-auto inline-block px-3 py-1 rounded-[10px]">{v.code}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-secondary">
                        {v.type === 'percent' ? `${v.value}%` : currency.format(v.value)}
                      </p>
                      <p className="text-[11px] text-admin-muted">
                        Đơn từ {currency.format(v.min_order_value)}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-xs text-sidebar-text">Bắt đầu: {new Date(v.start_date).toLocaleDateString('vi-VN')}</p>
                      <p className="text-xs text-sidebar-text">Kết thúc: {new Date(v.end_date).toLocaleDateString('vi-VN')}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 bg-sidebar-bubble-hover rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${Math.min(100, (v.used_count / v.usage_limit) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-secondary">{v.used_count} / {v.usage_limit}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        title={v.active ? 'Tắt mã này' : 'Bật mã này'}
                        onClick={() => handleToggleActive(v.id, v.active)}
                        className={cn(
                          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                          v.active ? 'bg-primary' : 'bg-sidebar-bubble-hover'
                        )}
                      >
                        <span
                          className={cn(
                            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                            v.active ? 'translate-x-6' : 'translate-x-1'
                          )}
                        />
                      </button>
                    </td>
                  </tr>
                ))}
                {vouchers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-sm font-semibold text-admin-muted">
                      Chưa có mã khuyến mãi nào được tạo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Logic cho modal */}
      <CreateVoucherModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(newVoucher) => {
          setVouchers((prev) => [newVoucher, ...prev]);
        }}
      />
    </div>
  );
}
