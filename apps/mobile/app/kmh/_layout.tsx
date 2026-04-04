import { Stack } from 'expo-router';

export default function KmhLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="apply" />
      <Stack.Screen name="result" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="complete" />
    </Stack>
  );
}
