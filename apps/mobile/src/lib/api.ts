// Always use production API (works on both Expo Go and production builds)
// For local API testing, change this to your machine's LAN IP: http://192.168.x.x:4000
const API_URL = 'https://securelend-production.up.railway.app';

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
    // 'ngrok-skip-browser-warning': 'true',
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
