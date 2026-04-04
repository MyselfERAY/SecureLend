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

// Tutorial — shown once per user
const TUTORIAL_KEY_PREFIX = 'securelend_tutorial_seen_';

export async function hasTutorialBeenSeen(userId: string): Promise<boolean> {
  if (!userId) return true; // Don't show if no user
  try {
    const val = await SecureStore.getItemAsync(`${TUTORIAL_KEY_PREFIX}${userId}`);
    return val === '1';
  } catch {
    return false;
  }
}

export async function setTutorialSeen(userId: string): Promise<void> {
  if (!userId) return;
  await SecureStore.setItemAsync(`${TUTORIAL_KEY_PREFIX}${userId}`, '1');
}

// Profile Photo — stored per user to prevent cross-user leakage
const PHOTO_KEY_PREFIX = 'securelend_profile_photo_';

export async function getProfilePhoto(userId: string): Promise<string | null> {
  if (!userId) return null;
  try {
    return await SecureStore.getItemAsync(`${PHOTO_KEY_PREFIX}${userId}`);
  } catch {
    return null;
  }
}

export async function setProfilePhoto(userId: string, uri: string): Promise<void> {
  if (!userId) return;
  await SecureStore.setItemAsync(`${PHOTO_KEY_PREFIX}${userId}`, uri);
}

export async function clearProfilePhoto(userId: string): Promise<void> {
  if (!userId) return;
  await SecureStore.deleteItemAsync(`${PHOTO_KEY_PREFIX}${userId}`);
}
