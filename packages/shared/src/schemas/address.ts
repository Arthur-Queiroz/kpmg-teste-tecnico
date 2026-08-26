import { z } from "zod";

/**
 * UFs in the official IBGE order. Exported so the frontend renders the same
 * list the schema accepts, instead of keeping a second copy of it.
 */
export const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
  "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
  "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

export type BrazilianState = (typeof BRAZILIAN_STATES)[number];

export const AddressSchema = z.object({
  zipCode: z
    .string()
    .trim()
    .regex(/^\d{5}-?\d{3}$/, "CEP inválido")
    .transform((value) => value.replace("-", ""))
    .describe("CEP, formato 00000000"),
  street: z
    .string()
    .trim()
    .min(3, "Logradouro deve ter ao menos 3 caracteres.")
    .max(150, "Logradouro deve ter no máximo 150 caracteres.")
    .describe("Logradouro"),
  number: z
    .string()
    .trim()
    .min(1, "Informe o número (ou S/N).")
    .max(20, "Número deve ter no máximo 20 caracteres.")
    .describe("Número (aceita 'S/N')"),
  complement: z
    .string()
    .trim()
    .max(100, "Complemento deve ter no máximo 100 caracteres.")
    .optional()
    .describe("Complemento"),
  neighborhood: z
    .string()
    .trim()
    .min(2, "Informe o bairro.")
    .max(100, "Bairro deve ter no máximo 100 caracteres.")
    .describe("Bairro"),
  city: z
    .string()
    .trim()
    .min(2, "Informe a cidade.")
    .max(100, "Cidade deve ter no máximo 100 caracteres.")
    .describe("Cidade"),
  state: z.enum(BRAZILIAN_STATES, { error: "Selecione a UF." }).describe("UF"),
});

export type Address = z.infer<typeof AddressSchema>;
