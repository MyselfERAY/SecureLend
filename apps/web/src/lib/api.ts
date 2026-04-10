function resolveApiUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!configured) return '';

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
