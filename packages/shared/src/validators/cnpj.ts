const CNPJ_LENGTH = 14;

/** Strips mask characters (dots, slash, dash), keeping only digits. */
export function unmaskCnpj(value: string): string {
  return (value ?? "").replace(/\D+/g, "");
}

/**
 * Validates a CNPJ using the full modulo 11 algorithm (both verification
 * digits), accepting masked or unmasked input.
 */
export function isValidCnpj(value: string): boolean {
  const digits = unmaskCnpj(value);

  if (digits.length !== CNPJ_LENGTH) {
    return false;
  }

  // Repeated sequences (00000000000000, 11111111111111, ...) pass the
  // modulo 11 check but are never real registrations.
  if (/^(\d)\1{13}$/.test(digits)) {
    return false;
  }

  const firstVerificationDigit = calculateVerificationDigit(digits, 12);
  const secondVerificationDigit = calculateVerificationDigit(digits, 13);

  return (
    firstVerificationDigit === Number(digits[12]) &&
    secondVerificationDigit === Number(digits[13])
  );
}

/**
 * Modulo 11 verification digit over the first `length` digits. Weights run
 * from 2 to 9, right to left, restarting at 2 once they pass 9.
 */
function calculateVerificationDigit(digits: string, length: number): number {
  let sum = 0;
  let weight = length - 7;

  for (let position = 0; position < length; position += 1) {
    sum += Number(digits[position]) * weight;
    weight -= 1;
    if (weight < 2) {
      weight = 9;
    }
  }

  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}
