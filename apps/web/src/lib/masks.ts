import { unmaskCnpj } from "@kpmg/shared";

/** Formats digits as 00.000.000/0000-00 while the user types. */
export function maskCnpj(value: string): string {
  const digits = unmaskCnpj(value).slice(0, 14);

  let masked = digits.slice(0, 2);
  if (digits.length > 2) masked += `.${digits.slice(2, 5)}`;
  if (digits.length > 5) masked += `.${digits.slice(5, 8)}`;
  if (digits.length > 8) masked += `/${digits.slice(8, 12)}`;
  if (digits.length > 12) masked += `-${digits.slice(12, 14)}`;

  return masked;
}

/** Formats digits as 00000-000 while the user types. */
export function maskZipCode(value: string): string {
  const digits = unmaskZipCode(value).slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

export function unmaskZipCode(value: string): string {
  return (value ?? "").replace(/\D+/g, "");
}
