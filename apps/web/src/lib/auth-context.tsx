'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api } from './api';

interface User {
  id: string;
  maskedTckn: string;
  fullName: string;
  phone: string;
  email: string | null;
  roles: string[];
  kycStatus: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  login: (tckn: string, phone: string) => Promise<{ userId: string; phone: string }>;
  register: (tckn: string, phone: string, fullName: string) => Promise<{ userId: string }>;
  verifyOtp: (phone: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('securelend_tokens');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AuthTokens;
        setTokens(parsed);
      } catch {
        localStorage.removeItem('securelend_tokens');
      }
    }
    setIsLoading(false);
  }, []);

  // Fetch user profile when tokens change
  useEffect(() => {
    if (tokens?.accessToken) {
      fetchProfile(tokens.accessToken);
    } else {
      setUser(null);
    }
  }, [tokens?.accessToken]);

  const fetchProfile = async (token: string) => {
    try {
      const res = await api<User>('/api/v1/users/me', { token });
      if (res.status === 'success' && res.data) {
        setUser(res.data);
      } else {
        // Token might be expired, try refresh
        if (tokens?.refreshToken) {
          await doRefresh(tokens.refreshToken);
        } else {
          clearAuth();
        }
      }
    } catch {
      clearAuth();
    }
  };

  const doRefresh = async (refreshToken: string) => {
    try {
      const res = await api<AuthTokens>('/api/v1/auth/refresh', {
        method: 'POST',
        body: { refreshToken },
      });
      if (res.status === 'success' && res.data) {
        saveTokens(res.data);
      } else {
        clearAuth();
      }
    } catch {
      clearAuth();
    }
  };

  const saveTokens = (newTokens: AuthTokens) => {
    setTokens(newTokens);
    localStorage.setItem('securelend_tokens', JSON.stringify(newTokens));
  };

  const clearAuth = () => {
    setUser(null);
    setTokens(null);
    localStorage.removeItem('securelend_tokens');
  };

  const register = async (tckn: string, phone: string, fullName: string) => {
    const res = await api<{ userId: string }>('/api/v1/auth/register', {
      method: 'POST',
      body: { tckn, phone, fullName },
    });
    if (res.status !== 'success' || !res.data) {
      throw new Error((res as any).data?.validation?.[0] || (res as any).data?.message || res.message || 'Kayit hatasi');
    }
    return res.data;
  };

  const login = async (tckn: string, phone: string) => {
    const res = await api<{ userId: string; phone: string }>('/api/v1/auth/login', {
      method: 'POST',
      body: { tckn, phone },
    });
    if (res.status !== 'success' || !res.data) {
      throw new Error((res as any).data?.validation?.[0] || (res as any).data?.message || res.message || 'Giris hatasi');
    }
    return res.data;
  };

  const verifyOtp = async (phone: string, code: string) => {
    const res = await api<AuthTokens>('/api/v1/auth/verify-otp', {
      method: 'POST',
      body: { phone, code },
    });
    if (res.status !== 'success' || !res.data) {
      throw new Error((res as any).data?.validation?.[0] || (res as any).data?.message || res.message || 'OTP hatasi');
    }
    saveTokens(res.data);
  };

  const logout = async () => {
    if (tokens?.refreshToken) {
      try {
        await api('/api/v1/auth/logout', {
          method: 'POST',
          body: { refreshToken: tokens.refreshToken },
          token: tokens.accessToken,
        });
      } catch {
        // Ignore errors on logout
      }
    }
    clearAuth();
  };

  const refreshUser = useCallback(async () => {
    if (tokens?.accessToken) {
      await fetchProfile(tokens.accessToken);
    }
  }, [tokens?.accessToken]);

  return (
    // @ts-expect-error React 19 Context.Provider JSX type mismatch with @types/react@19.2
    <AuthContext.Provider value={{ user, tokens, isLoading, login, register, verifyOtp, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
