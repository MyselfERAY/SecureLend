import { useEffect, useRef } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../src/lib/auth-context';
import {
  registerForPushNotifications,
  setupNotificationListeners,
  handleInitialNotification,
} from '../src/lib/push-notifications';

function AuthGate() {
  const { tokens, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const pushRegistered = useRef(false);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!tokens && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (tokens && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [tokens, isLoading, segments]);

  // Register for push notifications when user is authenticated
  useEffect(() => {
    if (!tokens?.accessToken || pushRegistered.current) return;

    pushRegistered.current = true;
    registerForPushNotifications(tokens.accessToken).catch((err) => {
      // Silent fail in dev — push tokens require EAS project or production build
      console.warn('Push notification registration skipped:', err?.message || err);
      pushRegistered.current = false;
    });
  }, [tokens]);

  // Reset registration flag when user logs out
  useEffect(() => {
    if (!tokens) {
      pushRegistered.current = false;
    }
  }, [tokens]);

  // Set up notification listeners and handle cold-start notification
  useEffect(() => {
    const cleanup = setupNotificationListeners();

    // Handle notification that opened the app from killed state
    handleInitialNotification().catch((err) => {
      console.error('Failed to handle initial notification:', err);
    });

    return cleanup;
  }, []);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <AuthGate />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
