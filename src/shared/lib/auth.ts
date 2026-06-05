import { findAdminAccount } from '../data/adminMock';

export type AuthMode = 'login' | 'register';

export interface AuthUser {
  name: string;
  email: string;
  phone: string;
  role?: string;
  streetAddress?: string;
  district?: string;
  city?: string;
}

interface StoredAuthAccount extends AuthUser {
  password: string;
  acceptMarketing: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthSuccessResult {
  ok: true;
  user: AuthUser;
}

interface AuthErrorResult {
  ok: false;
  error: string;
}

export type AuthActionResult = AuthSuccessResult | AuthErrorResult;

interface RegisterAuthUserInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  acceptMarketing: boolean;
}

interface LoginAuthUserInput {
  email: string;
  password: string;
}

const accountsStorageKey = 'ecocollect.auth.accounts';
const sessionStorageKey = 'ecocollect.auth.session';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string) {
  return phone.replace(/\s+/g, '').trim();
}

function isAuthUser(value: unknown): value is AuthUser {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.name === 'string' &&
    typeof candidate.email === 'string' &&
    typeof candidate.phone === 'string'
  );
}

function isStoredAuthAccount(value: unknown): value is StoredAuthAccount {
  if (!isAuthUser(value)) {
    return false;
  }

  const candidate = value as unknown as Record<string, unknown>;
  return (
    typeof candidate.password === 'string' &&
    typeof candidate.acceptMarketing === 'boolean' &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.updatedAt === 'string'
  );
}

/** Chuyển StoredAuthAccount → AuthUser (preserve role, address fields) */
function toAuthUser(account: StoredAuthAccount): AuthUser {
  return {
    name: account.name,
    email: account.email,
    phone: account.phone,
    role: account.role,
    streetAddress: account.streetAddress,
    district: account.district,
    city: account.city,
  };
}

function readStoredJson(storageKey: string) {
  if (!canUseStorage()) {
    return null;
  }

  try {
    return window.localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

function writeStoredJson(storageKey: string, value: string) {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(storageKey, value);
  } catch {
    // Ignore storage write failures in the demo auth layer.
  }
}

function removeStoredJson(storageKey: string) {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.removeItem(storageKey);
  } catch {
    // Ignore storage remove failures in the demo auth layer.
  }
}

function readAccounts() {
  const rawValue = readStoredJson(accountsStorageKey);

  if (!rawValue) {
    return [] as StoredAuthAccount[];
  }

  try {
    const parsedValue = JSON.parse(rawValue) as unknown;
    if (!Array.isArray(parsedValue)) {
      return [] as StoredAuthAccount[];
    }

    return parsedValue.filter(isStoredAuthAccount);
  } catch {
    return [] as StoredAuthAccount[];
  }
}

function writeAccounts(accounts: StoredAuthAccount[]) {
  writeStoredJson(accountsStorageKey, JSON.stringify(accounts));
}

export function persistAuthSession(user: AuthUser) {
  writeStoredJson(sessionStorageKey, JSON.stringify(user));
}

export function restoreAuthSession() {
  const rawValue = readStoredJson(sessionStorageKey);

  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue) as unknown;
    return isAuthUser(parsedValue) ? parsedValue : null;
  } catch {
    return null;
  }
}

export function clearAuthSession() {
  removeStoredJson(sessionStorageKey);
}

export function hasRegisteredAuthUser(email: string) {
  const normalizedEmail = normalizeEmail(email);

  if (normalizedEmail === '') {
    return false;
  }

  return readAccounts().some((account) => normalizeEmail(account.email) === normalizedEmail);
}

export function registerAuthUser(input: RegisterAuthUserInput): AuthActionResult {
  if (!canUseStorage()) {
    return {
      ok: false,
      error: 'Thiết bị hiện tại không hỗ trợ lưu tài khoản demo. Vui lòng thử lại trên trình duyệt khác.',
    };
  }

  const normalizedEmail = normalizeEmail(input.email);
  const normalizedPhone = normalizePhone(input.phone);
  const accounts = readAccounts();
  const duplicatedAccount = accounts.find((account) => normalizeEmail(account.email) === normalizedEmail);

  if (duplicatedAccount) {
    return {
      ok: false,
      error: 'Email này đã được đăng ký. Bạn có thể chuyển sang tab Đăng nhập để tiếp tục.',
    };
  }

  const timestamp = new Date().toISOString();
  const nextAccount: StoredAuthAccount = {
    name: input.name.trim(),
    email: normalizedEmail,
    phone: normalizedPhone,
    password: input.password,
    acceptMarketing: input.acceptMarketing,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  writeAccounts([...accounts, nextAccount]);

  const user = toAuthUser(nextAccount);
  persistAuthSession(user);

  return {
    ok: true,
    user,
  };
}

export function loginAuthUser(input: LoginAuthUserInput): AuthActionResult {
  const normalizedEmail = normalizeEmail(input.email);

  // First, check if it's an admin account from mock data
  const adminAccount = findAdminAccount(input.email, input.password);

  if (adminAccount) {
    const user: AuthUser = {
      name: adminAccount.name,
      email: adminAccount.email,
      phone: '0000000000',
      role: 'admin',
    };
    persistAuthSession(user);
    return { ok: true, user };
  }

  const matchedAccount = readAccounts().find((account) => normalizeEmail(account.email) === normalizedEmail);

  if (!matchedAccount) {
    return {
      ok: false,
      error: 'Email này chưa có tài khoản. Bạn có thể chuyển sang tab Đăng ký để tạo mới.',
    };
  }

  if (matchedAccount.password !== input.password) {
    return {
      ok: false,
      error: 'Mật khẩu chưa đúng. Vui lòng kiểm tra lại.',
    };
  }

  const user = toAuthUser(matchedAccount);
  persistAuthSession(user);

  return {
    ok: true,
    user,
  };
}

/**
 * Cập nhật thông tin tài khoản (name, phone, address).
 * Ghi vào danh sách accounts và cập nhật session.
 */
export function updateAccount(updatedUser: AuthUser): AuthActionResult {
  const accounts = readAccounts();
  const normalizedEmail = normalizeEmail(updatedUser.email);
  const idx = accounts.findIndex((a) => normalizeEmail(a.email) === normalizedEmail);

  if (idx === -1) {
    // Nếu là admin hoặc tài khoản không có trong storage thì chỉ cập nhật session
    persistAuthSession(updatedUser);
    return { ok: true, user: updatedUser };
  }

  const now = new Date().toISOString();
  const updatedAccount: StoredAuthAccount = {
    ...accounts[idx],
    name: updatedUser.name,
    phone: updatedUser.phone,
    streetAddress: updatedUser.streetAddress,
    district: updatedUser.district,
    city: updatedUser.city,
    updatedAt: now,
  };

  const nextAccounts = [...accounts];
  nextAccounts[idx] = updatedAccount;
  writeAccounts(nextAccounts);

  const user = toAuthUser(updatedAccount);
  persistAuthSession(user);

  return { ok: true, user };
}
