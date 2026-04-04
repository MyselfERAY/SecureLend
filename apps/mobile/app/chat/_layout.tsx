import { Stack } from 'expo-router';
import { colors } from '../../src/theme/colors';

export default function ChatLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.brand.dark },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '700' },
      }}
    />
  );
}
