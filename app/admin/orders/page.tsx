import type { Metadata } from 'next';
import AdminOrdersPage from '../../../src/components/admin/AdminOrdersPage';

export const metadata: Metadata = {
  title: 'Kiểm tra đơn hàng | EcoCollect',
  description: 'Trang admin theo dõi, xác nhận và hoàn tất đơn hàng.',
};

export default function AdminOrdersRoute() {
  return <AdminOrdersPage />;
}