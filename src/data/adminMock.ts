export interface AdminAccount {
  id: string;
  name: string;
  email: string;
  role: string;
  password: string;
  permissions: string[];
  shift: string;
}

export const adminAccounts: AdminAccount[] = [
  {
    id: 'ADM-01',
    name: 'Lan Nguyễn',
    email: 'admin@ecocollect.vn',
    role: 'Quản trị cấp cao',
    password: 'admin123',
    permissions: ['quản lý người dùng', 'phân công đơn', 'quản lý giá', 'báo cáo'],
    shift: 'Toàn quyền',
  },
  {
    id: 'ADM-02',
    name: 'Minh Trần',
    email: 'ops@ecocollect.vn',
    role: 'Admin vận hành',
    password: 'ops12345',
    permissions: ['phân công đơn', 'cập nhật trạng thái', 'điều phối nhân sự'],
    shift: '08:00 - 17:00',
  },
  {
    id: 'ADM-03',
    name: 'Hà Lê',
    email: 'cs@ecocollect.vn',
    role: 'Admin chăm sóc khách hàng',
    password: 'support123',
    permissions: ['hỗ trợ khách hàng', 'duyệt voucher', 'xử lý no-show'],
    shift: '09:00 - 18:00',
  },
];

export function findAdminAccount(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  return adminAccounts.find(
    (account) => account.email.toLowerCase() === normalizedEmail && account.password === password
  );
}