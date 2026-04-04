import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from './api';
import { AuthTokens, getStoredTokens, setStoredTokens, clearStoredTokens } from './storage';

export interface User {
  id: string;
  maskedTckn: string;
  fullName: string;
  phone: string;
  email: string | null;
  dateOfBirth: string | null;
  roles: string[];
  kycStatus: string;
}

export interface ConsentRecord {
  type: string;
  version: string;
}

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  login: (tckn: string, phone: string) => Promise<{ userId: string; phone: string }>;
  register: (tckn: string, phone: string, fullName: string, dateOfBirth: string, consents?: ConsentRecord[]) => Promise<{ userId: string }>;
  verifyOtp: (phone: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearAuth = useCallback(async () => {
    setUser(null);
    setTokens(null);
    await clearStoredTokens();
  }, []);

  const saveTokens = useCallback(async (t: AuthTokens) => {
    setTokens(t);
    await setStoredTokens(t);
  }, []);

  const fetchProfile = useCallback(async (accessToken: string): Promise<boolean> => {
    try {
      const res = await api<User>('/api/v1/users/me', { token: accessToken });
      if (res.status === 'success' && res.data) {
        setUser(res.data);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const doRefresh = useCallback(async (refreshToken: string): Promise<AuthTokens | null> => {
    try {
      const res = await api<AuthTokens>('/api/v1/auth/refresh', {
        method: 'POST',
        body: { refreshToken },
      });
      if (res.status === 'success' && res.data) {
        return res.data;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // Restore session on mount
  useEffect(() => {
    (async () => {
      const stored = await getStoredTokens();
      if (!stored) {
        setIsLoading(false);
        return;
      }

      setTokens(stored);

      const ok = await fetchProfile(stored.accessToken);
      if (!ok) {
        const newTokens = await doRefresh(stored.refreshToken);
        if (newTokens) {
          await saveTokens(newTokens);
          const ok2 = await fetchProfile(newTokens.accessToken);
          if (!ok2) await clearAuth();
        } else {
          await clearAuth();
        }
      }
      setIsLoading(false);
    })();
  }, []);

  const login = useCallback(async (tckn: string, phone: string) => {
    const res = await api<{ userId: string; phone: string }>('/api/v1/auth/login', {
      method: 'POST',
      body: { tckn, phone },
    });
    if (res.status === 'success' && res.data) {
      return res.data;
    }
    throw new Error((res as any).data?.message || res.message || 'Giris basarisiz');
  }, []);

  const register = useCallback(async (tckn: string, phone: string, fullName: string, dateOfBirth: string, consents?: ConsentRecord[]) => {
    const body: Record<string, unknown> = { tckn, phone, fullName, dateOfBirth };
    if (consents && consents.length > 0) {
      body.consents = consents;
    }
    const res = await api<{ userId: string }>('/api/v1/auth/register', {
      method: 'POST',
      body,
    });
    if (res.status === 'success' && res.data) {
      return res.data;
    }
    throw new Error((res as any).data?.message || res.message || 'Kayit basarisiz');
  }, []);

  const verifyOtp = useCallback(async (phone: string, code: string) => {
    const res = await api<AuthTokens>('/api/v1/auth/verify-otp', {
      method: 'POST',
      body: { phone, code },
    });
    if (res.status === 'success' && res.data) {
      await saveTokens(res.data);
      await fetchProfile(res.data.accessToken);
    } else {
      throw new Error((res as any).data?.message || res.message || 'OTP dogrulama basarisiz');
    }
  }, [saveTokens, fetchProfile]);

  const logout = useCallback(async () => {
    if (tokens) {
      try {
        await api('/api/v1/auth/logout', {
          method: 'POST',
          body: { refreshToken: tokens.refreshToken },
          token: tokens.accessToken,
        });
      } catch { /* ignore */ }
    }
    await clearAuth();
  }, [tokens, clearAuth]);

  const refreshUser = useCallback(async () => {
    if (tokens) {
      await fetchProfile(tokens.accessToken);
    }
  }, [tokens, fetchProfile]);

  return (
    <AuthContext.Provider
      value={{ user, tokens, isLoading, login, register, verifyOtp, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
