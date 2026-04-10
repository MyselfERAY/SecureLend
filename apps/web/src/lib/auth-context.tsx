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
  onboardingCompleted?: boolean;
}

interface AuthContextType {
  user: User | null;
  tokens: { accessToken: string; expiresIn: number } | null;
  isLoading: boolean;
  login: (tckn: string, phone: string) => Promise<{ userId: string; phone: string }>;
  register: (tckn: string, phone: string, fullName: string, dateOfBirth: string, consents?: Array<{ type: string; version: string }>) => Promise<{ userId: string }>;
  verifyOtp: (phone: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<{ accessToken: string; expiresIn: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: try to restore session via httpOnly refresh cookie
  useEffect(() => {
    tryRestoreSession();
  }, []);

  // Fetch user profile when accessToken changes
  useEffect(() => {
    if (tokens?.accessToken) {
      fetchProfile(tokens.accessToken);
    } else {
      setUser(null);
    }
  }, [tokens?.accessToken]);

  const tryRestoreSession = async () => {
    try {
      const res = await api<{ accessToken: string; expiresIn: number }>('/api/v1/auth/refresh', {
        method: 'POST',
        body: {},
      });
      if (res.status === 'success' && res.data?.accessToken) {
        setTokens(res.data);
      }
    } catch {
      // No valid session — that's fine
    }
    setIsLoading(false);
  };

  const fetchProfile = async (token: string) => {
    try {
      const res = await api<User>('/api/v1/users/me', { token });
      if (res.status === 'success' && res.data) {
        setUser(res.data);
      } else {
        clearAuth();
      }
    } catch {
      clearAuth();
    }
  };

  const clearAuth = () => {
    setUser(null);
    setTokens(null);
  };

  const register = async (tckn: string, phone: string, fullName: string, dateOfBirth: string, consents?: Array<{ type: string; version: string }>) => {
    const res = await api<{ userId: string }>('/api/v1/auth/register', {
      method: 'POST',
      body: { tckn, phone, fullName, dateOfBirth, ...(consents ? { consents } : {}) },
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
    const res = await api<{ accessToken: string; expiresIn: number }>('/api/v1/auth/verify-otp', {
      method: 'POST',
      body: { phone, code },
    });
    if (res.status !== 'success' || !res.data) {
      throw new Error((res as any).data?.validation?.[0] || (res as any).data?.message || res.message || 'OTP hatasi');
    }
    // refreshToken is now set as httpOnly cookie by the backend
    setTokens(res.data);
  };

  const logout = async () => {
    try {
      await api('/api/v1/auth/logout', {
        method: 'POST',
        body: {},
        token: tokens?.accessToken,
      });
    } catch {
      // Ignore errors on logout
    }
    clearAuth();
  };

  const refreshUser = useCallback(async () => {
    if (tokens?.accessToken) {
      await fetchProfile(tokens.accessToken);
    }
  }, [tokens?.accessToken]);

  return (
    // @ts-ignore React 19 Context.Provider JSX type mismatch with @types/react@19.2
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
