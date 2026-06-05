export interface AdminAccount {
  id: string;
  name: string;
  email: string;
  role: string;
  password: string;
  permissions: string[];
  shift: string;
}

export const adminAccounts: AdminAccount[] = [];

export function findAdminAccount(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  return adminAccounts.find(
    (account) => account.email.toLowerCase() === normalizedEmail && account.password === password
  );
}
