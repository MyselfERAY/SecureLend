import { Platform } from 'react-native';

// ngrok public URL — internetten erişim için
// Lokalde test için 'http://localhost:4000' kullanabilirsin
const NGROK_API_URL = 'https://nitrogenous-isabel-unslopped.ngrok-free.dev';

const API_URL = NGROK_API_URL || Platform.select({
  android: 'http://10.0.2.2:4000',
  default: 'http://localhost:4000',
});

interface ApiOptions {
  method?: string;
  body?: unknown;
  token?: string;
}

export async function api<T = unknown>(
  path: string,
  options: ApiOptions = {},
): Promise<{ status: string; data?: T; message?: string }> {
  const { method = 'GET', body, token } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  return res.json();
}

export function extractError(
  res: { status: string; data?: any; message?: string },
  fallback = 'Bir hata olustu',
): string {
  return (
    res?.data?.validation?.[0] ||
    res?.data?.message ||
    res?.message ||
    fallback
  );
}
