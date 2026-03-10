/**
 * Validates a Turkish National ID Number (TCKN / TC Kimlik No).
 *
 * Algorithm:
 *   - 11 digits, first digit != 0
 *   - d[9]  = ((7 * (d[0]+d[2]+d[4]+d[6]+d[8]) - (d[1]+d[3]+d[5]+d[7])) % 10
 *   - d[10] = (d[0]+d[1]+...+d[9]) % 10
 */
export function validateTckn(tckn: string): boolean {
  if (tckn.length !== 11) return false;
  if (!/^\d{11}$/.test(tckn)) return false;
  if (tckn[0] === '0') return false;

  const digits = tckn.split('').map(Number);

  // 10th digit check (index 9)
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
  const tenthDigit = (7 * oddSum - evenSum) % 10;
  const correctedTenth = ((tenthDigit % 10) + 10) % 10;

  if (digits[9] !== correctedTenth) return false;

  // 11th digit check (index 10)
  const sumFirstTen = digits.slice(0, 10).reduce((a, b) => a + b, 0);
  if (digits[10] !== sumFirstTen % 10) return false;

  return true;
}
