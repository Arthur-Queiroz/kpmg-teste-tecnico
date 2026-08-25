// Shared Zod schemas and validators, imported by both apps/api and apps/web.
// See docs/02-DATA-MODEL.md and docs/10-CONVENTIONS.md.

export { AddressSchema, BRAZILIAN_STATES } from "./schemas/address";
export type { Address, BrazilianState } from "./schemas/address";

export { CnpjSchema, CompanySchema, CompanyRecordSchema } from "./schemas/company";
export type { Company, CompanyRecord } from "./schemas/company";

export { isValidCnpj, unmaskCnpj } from "./validators/cnpj";
