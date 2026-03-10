import { TextStyle } from 'react-native';
import { colors } from './colors';

export const typography: Record<string, TextStyle> = {
  h1: { fontSize: 28, fontWeight: '800', color: colors.gray[900], letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700', color: colors.gray[900] },
  h3: { fontSize: 18, fontWeight: '600', color: colors.gray[900] },
  body: { fontSize: 15, fontWeight: '400', color: colors.gray[700], lineHeight: 22 },
  bodySmall: { fontSize: 13, fontWeight: '400', color: colors.gray[500] },
  label: { fontSize: 14, fontWeight: '600', color: colors.gray[700] },
  caption: { fontSize: 12, fontWeight: '500', color: colors.gray[400] },
  mono: { fontSize: 14, fontWeight: '500', fontFamily: 'monospace' },
};
