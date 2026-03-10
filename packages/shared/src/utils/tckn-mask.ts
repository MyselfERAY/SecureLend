/**
 * Masks a TCKN for display/logging purposes.
 * Example: "12345678902" -> "12*******02"
 */
export function maskTckn(tckn: string): string {
  if (tckn.length !== 11) return '***********';
  return `${tckn.slice(0, 2)}${'*'.repeat(7)}${tckn.slice(-2)}`;
}
