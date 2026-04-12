import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import Onboarding from '../src/components/Onboarding';
import { setOnboardingSeen } from '../src/lib/storage';

export default function OnboardingScreen() {
  const router = useRouter();

  const handleComplete = useCallback(async () => {
    await setOnboardingSeen();
    router.replace('/(auth)/login');
  }, [router]);

  return <Onboarding onComplete={handleComplete} />;
}
