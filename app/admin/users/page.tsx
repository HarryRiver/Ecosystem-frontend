import type { Metadata } from 'next';
import AdminUsersPage from '../../../src/components/admin/AdminUsersPage';

export const metadata: Metadata = {
  title: 'Quản lý user | EcoCollect',
  description: 'Trang admin quản lý người dùng, tài khoản thành viên và thông tin đơn gần nhất.',
};

export default function AdminUsersRoute() {
  return <AdminUsersPage />;
}
