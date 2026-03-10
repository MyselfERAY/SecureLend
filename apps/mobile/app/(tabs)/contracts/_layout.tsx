import { Stack } from 'expo-router';
import { colors } from '../../../src/theme/colors';

export default function ContractsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.white },
        headerTitleStyle: { fontWeight: '700', fontSize: 17, color: colors.gray[900] },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Sozlesmeler' }} />
      <Stack.Screen name="[id]" options={{ title: 'Sozlesme Detay' }} />
    </Stack>
  );
}
