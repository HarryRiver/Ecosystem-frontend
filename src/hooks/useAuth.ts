/**
 * src/hooks/useAuth.ts
 * ─────────────────────────────────────────────────────────────
 * Hook quản lý trạng thái xác thực toàn cục.
 *
 * - Lưu user trong localStorage (session persistence).
 * - Expose: user, isLoading, login, register, logout.
 * - Khi token hết hạn (401), apiClient dispatch event
 *   'ecocollect:unauthorized' và hook này lắng nghe để logout.
 * ─────────────────────────────────────────────────────────────
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getMe,
} from '@/services/auth.service';
import { getToken } from '@/lib/apiClient';
import { type ApiUser, type LoginBody, type RegisterBody } from '@/types/api';
import { type ApiError } from '@/lib/apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UseAuthReturn {
  user: ApiUser | null;
  isLoading: boolean;
  login: (body: LoginBody) => Promise<ApiUser>;
  register: (body: RegisterBody) => Promise<ApiUser>;
  logout: () => Promise<void>;
}

const SESSION_KEY = 'ecocollect.auth.user';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readSessionUser(): ApiUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as ApiUser) : null;
  } catch {
    return null;
  }
}

function writeSessionUser(user: ApiUser): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function clearSessionUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<ApiUser | null>(readSessionUser);
  const [isLoading, setIsLoading] = useState<boolean>(() => !!getToken() && !readSessionUser());

  // Khi có token nhưng chưa có user trong session → fetch /me
  useEffect(() => {
    const token = getToken();
    if (!token || readSessionUser()) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    getMe()
      .then((fetchedUser) => {
        writeSessionUser(fetchedUser);
        setUser(fetchedUser);
      })
      .catch(() => {
        // Token không hợp lệ → clear
        clearSessionUser();
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Lắng nghe event 401 từ apiClient interceptor
  useEffect(() => {
    const handleUnauthorized = () => {
      clearSessionUser();
      setUser(null);
    };
    window.addEventListener('ecocollect:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('ecocollect:unauthorized', handleUnauthorized);
    };
  }, []);

  // ─── Actions ───────────────────────────────────────────────────────────────

  const login = useCallback(async (body: LoginBody): Promise<ApiUser> => {
    const payload = await apiLogin(body);
    writeSessionUser(payload.user);
    setUser(payload.user);
    return payload.user;
  }, []);

  const register = useCallback(async (body: RegisterBody): Promise<ApiUser> => {
    const payload = await apiRegister(body);
    writeSessionUser(payload.user);
    setUser(payload.user);
    return payload.user;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await apiLogout();
    clearSessionUser();
    setUser(null);
  }, []);

  return { user, isLoading, login, register, logout };
}

// ─── Re-export ApiError để dùng trong components ─────────────────────────────
export type { ApiError };
