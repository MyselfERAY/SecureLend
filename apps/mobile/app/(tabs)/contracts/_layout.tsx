import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { colors } from '../../../src/theme/colors';

export default function ContractsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.white,
        },
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 17,
          color: colors.gray[900],
        },
        headerShadowVisible: false,
        headerTintColor: colors.gray[900],
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Sozlesmeler' }} />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Sozlesme Detay',
          headerBackTitle: 'Geri',
        }}
      />
    </Stack>
  );
}
