import { z } from "zod";

import { AddressSchema } from "./address";
import { isValidCnpj, unmaskCnpj } from "../validators/cnpj";

/**
 * Accepts the CNPJ masked or unmasked and always yields the 14 digits, so the
 * API and the database never store two different formats for the same value.
 */
export const CnpjSchema = z
  .string()
  .transform(unmaskCnpj)
  .refine(isValidCnpj, { message: "CNPJ inválido" })
  .describe("CNPJ, somente dígitos");

export const CompanySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe o nome (mínimo 2 caracteres).")
    .max(150, "Nome deve ter no máximo 150 caracteres.")
    .describe("Nome"),
  cnpj: CnpjSchema,
  tradeName: z
    .string()
    .trim()
    .min(2, "Informe o nome fantasia.")
    .max(150, "Nome fantasia deve ter no máximo 150 caracteres.")
    .describe("Nome Fantasia"),
  address: AddressSchema,
});

export type Company = z.infer<typeof CompanySchema>;

/**
 * A company as returned by the API — the input schema plus the fields the
 * database owns. See `docs/03-API-SPEC.md`.
 */
export const CompanyRecordSchema = CompanySchema.extend({
  id: z.string().describe("Identificador (uuid)"),
  createdAt: z.string().describe("Data de criação (ISO 8601)"),
  updatedAt: z.string().describe("Data da última alteração (ISO 8601)"),
});

export type CompanyRecord = z.infer<typeof CompanyRecordSchema>;
