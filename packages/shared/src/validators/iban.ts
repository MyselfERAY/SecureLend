/**
 * Validates a Turkish IBAN.
 * - Must start with "TR"
 * - Must be exactly 26 characters
 * - Must pass ISO 13616 mod-97 checksum
 */
export function validateTurkishIban(iban: string): boolean {
  // Remove spaces and convert to uppercase
  const cleaned = iban.replace(/\s/g, '').toUpperCase();

  // Check TR prefix and length
  if (!/^TR\d{24}$/.test(cleaned)) {
    return false;
  }

  // ISO 13616 mod-97 check:
  // Move the first 4 characters to the end
  const rearranged = cleaned.slice(4) + cleaned.slice(0, 4);

  // Replace each letter with two digits (A=10, B=11, ..., Z=35)
  let numericString = '';
  for (const char of rearranged) {
    const code = char.charCodeAt(0);
    if (code >= 48 && code <= 57) {
      // digit
      numericString += char;
    } else {
      // letter: A=10, B=11, ...
      numericString += (code - 55).toString();
    }
  }

  // Compute mod 97 using chunked arithmetic to avoid BigInt
  let remainder = 0;
  for (let i = 0; i < numericString.length; i++) {
    remainder = (remainder * 10 + parseInt(numericString[i], 10)) % 97;
  }

  return remainder === 1;
}
