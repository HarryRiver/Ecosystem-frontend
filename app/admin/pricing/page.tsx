import type { Metadata } from 'next';
import AdminPricingPage from '../../../src/components/admin/AdminPricingPage';

export const metadata: Metadata = {
  title: 'Cập nhật giá dịch vụ | EcoCollect',
  description: 'Trang admin điều chỉnh bảng giá dịch vụ thu gom của EcoCollect.',
};

export default function AdminPricingRoute() {
  return <AdminPricingPage />;
}
