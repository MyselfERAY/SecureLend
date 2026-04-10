function resolveApiUrl(): string {
  // In production, use relative paths so requests go through Vercel proxy (same domain).
  // This ensures httpOnly cookies are set on the correct domain.
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return '';
  }

  // In development, use the configured API URL (typically http://localhost:4000)
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  return configured || '';
}

const API_URL = resolveApiUrl();

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
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include', // Send httpOnly cookies
  });

  // Handle 401: try refresh (cookie auto-sent), then retry once
  if (res.status === 401 && token) {
    const refreshRes = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      credentials: 'include',
    });

    const refreshData = await refreshRes.json();
    if (refreshData.status === 'success' && refreshData.data?.accessToken) {
      // Retry with new access token
      const retryRes = await fetch(`${API_URL}${path}`, {
        method,
        headers: { ...headers, Authorization: `Bearer ${refreshData.data.accessToken}` },
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include',
      });
      if (retryRes.status === 401) {
        handleSessionExpired();
        return { status: 'fail', data: { message: 'Oturum suresi doldu.' } as any };
      }
      return retryRes.json();
    }

    handleSessionExpired();
    return { status: 'fail', data: { message: 'Oturum suresi doldu.' } as any };
  }

  return res.json();
}

function handleSessionExpired(): void {
  if (typeof window === 'undefined') return;
  if (!window.location.pathname.startsWith('/auth')) {
    window.location.href = '/auth/login?expired=1';
  }
}
