import { Redirect } from 'expo-router';
import { useAuth } from '../src/lib/auth-context';
import { LoadingSpinner } from '../src/components/ui/LoadingSpinner';

export default function Index() {
  const { tokens, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;
  if (tokens) return <Redirect href="/(tabs)" />;
  return <Redirect href="/(auth)/login" />;
}
