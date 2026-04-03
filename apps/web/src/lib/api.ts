function resolveApiUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!configured) return '';

  // If a public device hits the app and env still points to localhost,
  // force same-origin calls through Next.js rewrites.
  const isLocalApi = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(configured);
  if (isLocalApi && typeof window !== 'undefined') {
    const host = window.location.hostname;
    const isLocalHost = host === 'localhost' || host === '127.0.0.1';
    if (!isLocalHost) return '';
  }

  return configured;
}

const API_URL = resolveApiUrl();

interface ApiOptions {
  method?: string;
  body?: unknown;
  token?: string;
}

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;

async function tryRefreshToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem('securelend_tokens');
  if (!stored) return null;

  try {
    const tokens = JSON.parse(stored);
    if (!tokens.refreshToken) return null;

    if (isRefreshing) return null;
    isRefreshing = true;

    const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });

    const data = await res.json();
    isRefreshing = false;

    if (data.status === 'success' && data.data?.accessToken) {
      localStorage.setItem('securelend_tokens', JSON.stringify(data.data));
      return data.data.accessToken;
    }

    return null;
  } catch {
    isRefreshing = false;
    return null;
  }
}

function handleSessionExpired(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('securelend_tokens');
  // Only redirect if not already on auth pages
  if (!window.location.pathname.startsWith('/auth')) {
    window.location.href = '/auth/login?expired=1';
  }
}

export async function api<T = unknown>(
  path: string,
  options: ApiOptions = {},
): Promise<{ status: string; data?: T; message?: string }> {
  const { method = 'GET', body, token } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Handle 401: try refresh, then retry once
  if (res.status === 401 && token) {
    const newToken = await tryRefreshToken();
    if (newToken) {
      // Retry with new token
      const retryRes = await fetch(`${API_URL}${path}`, {
        method,
        headers: { ...headers, Authorization: `Bearer ${newToken}` },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (retryRes.status === 401) {
        handleSessionExpired();
        return { status: 'fail', data: { message: 'Oturum suresi doldu. Lutfen tekrar giris yapin.' } as any };
      }
      return retryRes.json();
    }

    // Refresh failed — session expired
    handleSessionExpired();
    return { status: 'fail', data: { message: 'Oturum suresi doldu. Lutfen tekrar giris yapin.' } as any };
  }

  return res.json();
}
