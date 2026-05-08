'use client';

import { useEffect, useState } from 'react';
import { cn } from '../../utils/cn';
import { currency } from '../../data/adminDashboardMock';
import {
  getAdminVouchers,
  createAdminVoucher,
  updateAdminVoucher,
} from '../../services/admin.service';
import type { Voucher, CreateVoucherBody } from '../../types/api';

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#103B2D]/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md animate-scaleUp rounded-[28px] bg-white p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-bold text-[#103B2D]">Mã Khuyến Mãi Mới</h3>
          <button
            title="Đóng"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F4FAF5] text-[#2F855A] transition-colors hover:bg-[#DFF0E5]"
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
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#6D877A]">Mã Code</label>
            <input
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="VD: GIAMGIA10"
              className="w-full rounded-xl border border-[#DFF0E5] bg-[#F7FCF8] px-4 py-3 text-sm font-semibold text-[#103B2D] outline-none transition-colors focus:border-[#2F855A] focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#6D877A]">Loại</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full rounded-xl border border-[#DFF0E5] bg-[#F7FCF8] px-4 py-3 text-sm font-semibold text-[#103B2D] outline-none focus:border-[#2F855A] focus:bg-white"
              >
                <option value="fixed">Tiền mặt (đ)</option>
                <option value="percent">Phần trăm (%)</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#6D877A]">Giá trị giảm</label>
              <input
                required
                type="number"
                min={0}
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                className="w-full rounded-xl border border-[#DFF0E5] bg-[#F7FCF8] px-4 py-3 text-sm font-semibold text-[#103B2D] outline-none focus:border-[#2F855A] focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#6D877A]">Đơn tối thiểu</label>
              <input
                required
                type="number"
                min={0}
                value={formData.min_order_value}
                onChange={(e) => setFormData({ ...formData, min_order_value: Number(e.target.value) })}
                className="w-full rounded-xl border border-[#DFF0E5] bg-[#F7FCF8] px-4 py-3 text-sm font-semibold text-[#103B2D] outline-none focus:border-[#2F855A] focus:bg-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#6D877A]">Tổng lượt dùng</label>
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
                className="w-full rounded-xl border border-[#DFF0E5] bg-[#F7FCF8] px-4 py-3 text-sm font-semibold text-[#103B2D] outline-none focus:border-[#2F855A] focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#6D877A]">Mỗi khách tối đa</label>
            <input
              required
              type="number"
              min={0}
              value={formData.per_user_limit ?? formData.usage_limit}
              onChange={(e) => setFormData({ ...formData, per_user_limit: Number(e.target.value) })}
              className="w-full rounded-xl border border-[#DFF0E5] bg-[#F7FCF8] px-4 py-3 text-sm font-semibold text-[#103B2D] outline-none focus:border-[#2F855A] focus:bg-white"
            />
            <p className="mt-1 text-xs font-medium text-[#789185]">Nhập 0 nếu không giới hạn theo từng khách.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#6D877A]">Từ ngày</label>
              <input
                type="datetime-local"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full rounded-xl border border-[#DFF0E5] bg-[#F7FCF8] px-4 py-3 text-sm font-semibold text-[#103B2D] outline-none focus:border-[#2F855A] focus:bg-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#6D877A]">Đến ngày</label>
              <input
                type="datetime-local"
                required
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full rounded-xl border border-[#DFF0E5] bg-[#F7FCF8] px-4 py-3 text-sm font-semibold text-[#103B2D] outline-none focus:border-[#2F855A] focus:bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-[#2F855A] px-6 py-4 text-center font-bold text-white transition-all hover:bg-[#256846] disabled:opacity-50"
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
          <h1 className="text-2xl font-bold text-[#103B2D]">Quản lý Vouchers</h1>
          <p className="mt-1 text-sm text-[#6D877A]">Tạo và kiểm soát các chiến dịch mã giảm giá</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 rounded-full bg-[#103B2D] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#2F855A] hover:shadow-lg"
        >
          <svg className="h-5 w-5" fill="none" strokeWidth={2} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Tạo mã mới
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[24px] bg-white p-5 shadow-[0_8px_30px_rgba(16,59,45,0.05)] border border-[#E8F5EC]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#8AA89A]">Tổng mã hệ thống</p>
          <p className="mt-2 text-3xl font-bold text-[#103B2D]">{vouchers.length}</p>
        </div>
        <div className="rounded-[24px] bg-white p-5 shadow-[0_8px_30px_rgba(16,59,45,0.05)] border border-[#E8F5EC]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#8AA89A]">Đang hoạt động</p>
          <p className="mt-2 text-3xl font-bold text-[#2F855A]">{activeCount}</p>
        </div>
        <div className="rounded-[24px] bg-white p-5 shadow-[0_8px_30px_rgba(16,59,45,0.05)] border border-[#E8F5EC]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#8AA89A]">Đã hết hạn/tạm dừng</p>
          <p className="mt-2 text-3xl font-bold text-amber-500">{expiredCount}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-[24px] border border-[#DFF0E5] bg-white py-12 text-center shadow-[0_8px_30px_rgba(16,59,45,0.05)]">
          <p className="text-sm font-semibold text-[#8AA89A]">Đang tải dữ liệu voucher...</p>
        </div>
      ) : error ? (
        <div className="rounded-[24px] border border-red-200 bg-red-50 p-6 text-red-600 font-semibold text-center">
          {error}
        </div>
      ) : (
        <div className="rounded-[24px] border border-[#DFF0E5] bg-white shadow-[0_8px_30px_rgba(16,59,45,0.05)]">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-[#EEF8F1]">
                  <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-[#8AA89A]">Bản ghi</th>
                  <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-[#8AA89A]">Giảm giá</th>
                  <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-[#8AA89A]">Hiệu lực</th>
                  <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-[#8AA89A]">Giới hạn sử dụng</th>
                  <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-[#8AA89A]">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {vouchers.map((v, i) => (
                  <tr key={v.id} className={cn('border-b border-[#F0F7F2] transition-colors', i % 2 === 1 && 'bg-[#FAFCFB]')}>
                    <td className="px-5 py-4">
                      <p className="text-base font-bold text-[#103B2D] uppercase tracking-wide bg-[#EBF7F0] w-auto inline-block px-3 py-1 rounded-[10px]">{v.code}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[#103B2D]">
                        {v.type === 'percent' ? `${v.value}%` : currency.format(v.value)}
                      </p>
                      <p className="text-[11px] text-[#8AA89A]">
                        Đơn từ {currency.format(v.min_order_value)}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-xs text-[#476458]">Bắt đầu: {new Date(v.start_date).toLocaleDateString('vi-VN')}</p>
                      <p className="text-xs text-[#476458]">Kết thúc: {new Date(v.end_date).toLocaleDateString('vi-VN')}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 bg-[#E0F5E6] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#2F855A] rounded-full"
                            style={{ width: `${Math.min(100, (v.used_count / v.usage_limit) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-[#103B2D]">{v.used_count} / {v.usage_limit}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        title={v.active ? 'Tắt mã này' : 'Bật mã này'}
                        onClick={() => handleToggleActive(v.id, v.active)}
                        className={cn(
                          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                          v.active ? 'bg-[#2F855A]' : 'bg-[#DFF0E5]'
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
                    <td colSpan={5} className="px-5 py-8 text-center text-sm font-semibold text-[#8AA89A]">
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
