import { useState, useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/lib/auth-context';
import { LoadingSpinner } from '../src/components/ui/LoadingSpinner';
import { hasOnboardingBeenSeen } from '../src/lib/storage';

export default function Index() {
  const { tokens, isLoading } = useAuth();
  const [onboardingSeen, setOnboardingSeen] = useState<boolean | null>(null);

  useEffect(() => {
    hasOnboardingBeenSeen().then(setOnboardingSeen);
  }, []);

  if (isLoading || onboardingSeen === null) return <LoadingSpinner />;
  if (!onboardingSeen) return <Redirect href="/onboarding" />;
  if (tokens) return <Redirect href="/(tabs)" />;
  return <Redirect href="/(auth)/login" />;
}
