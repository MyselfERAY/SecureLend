import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'securelend_tokens';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}

export async function getStoredTokens(): Promise<AuthTokens | null> {
  try {
    const raw = await SecureStore.getItemAsync(TOKEN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function setStoredTokens(tokens: AuthTokens): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(tokens));
}

export async function clearStoredTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
