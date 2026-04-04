import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Validates a Turkish IBAN.
 * - Must start with "TR"
 * - Must be exactly 26 characters
 * - Must pass ISO 13616 mod-97 checksum
 */
export function validateTurkishIban(iban: string): boolean {
  const cleaned = iban.replace(/\s/g, '').toUpperCase();

  if (!/^TR\d{24}$/.test(cleaned)) {
    return false;
  }

  // ISO 13616 mod-97 check: move first 4 chars to end
  const rearranged = cleaned.slice(4) + cleaned.slice(0, 4);

  // Replace letters with numeric equivalents (A=10, B=11, ..., Z=35)
  let numericString = '';
  for (const char of rearranged) {
    const code = char.charCodeAt(0);
    if (code >= 48 && code <= 57) {
      numericString += char;
    } else {
      numericString += (code - 55).toString();
    }
  }

  // Compute mod 97 using chunked arithmetic
  let remainder = 0;
  for (let i = 0; i < numericString.length; i++) {
    remainder = (remainder * 10 + parseInt(numericString[i], 10)) % 97;
  }

  return remainder === 1;
}

@ValidatorConstraint({ name: 'isTurkishIban', async: false })
class IsTurkishIbanConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string') {
      return false;
    }
    return validateTurkishIban(value);
  }

  defaultMessage(): string {
    return 'Gecerli bir Turk IBAN giriniz (TR ile baslamali, 26 karakter, mod97 kontrolu)';
  }
}

export function IsTurkishIban(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsTurkishIbanConstraint,
    });
  };
}
