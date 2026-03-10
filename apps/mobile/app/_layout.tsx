import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../src/lib/auth-context';

function AuthGate() {
  const { tokens, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!tokens && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (tokens && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [tokens, isLoading, segments]);

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
