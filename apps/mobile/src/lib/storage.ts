import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'securelend_tokens';
const CREDENTIALS_KEY = 'securelend_credentials';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}

export interface SavedCredentials {
  tckn: string;
  phone: string;
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

export async function getSavedCredentials(): Promise<SavedCredentials | null> {
  try {
    const raw = await SecureStore.getItemAsync(CREDENTIALS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function setSavedCredentials(creds: SavedCredentials): Promise<void> {
  await SecureStore.setItemAsync(CREDENTIALS_KEY, JSON.stringify(creds));
}

export async function clearSavedCredentials(): Promise<void> {
  await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
}

// Profile Photo (stored as base64 URI locally)
const PHOTO_KEY = 'securelend_profile_photo';

export async function getProfilePhoto(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(PHOTO_KEY);
  } catch {
    return null;
  }
}

export async function setProfilePhoto(uri: string): Promise<void> {
  await SecureStore.setItemAsync(PHOTO_KEY, uri);
}

export async function clearProfilePhoto(): Promise<void> {
  await SecureStore.deleteItemAsync(PHOTO_KEY);
}
