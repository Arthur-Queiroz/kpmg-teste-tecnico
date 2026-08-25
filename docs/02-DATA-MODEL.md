# Modelo de Dados

## Decisão de modelagem: Address como objeto

`Address` é modelado como um **objeto Zod aninhado**, persistido em uma
coluna `Json` no Postgres (via Prisma), e não como colunas flat nem como
entidade relacional separada. Justificativa registrada em
`09-DECISIONS.md`: o PDF trata "Endereço" como um conceito único, e o
objeto aninhado permite validação estruturada (Zod) sem forçar um JOIN
desnecessário para uma relação estritamente 1:1.

## Schema Zod (`packages/shared/src/schemas`)

```ts
export const AddressSchema = z.object({
  zipCode: z.string()
    .regex(/^\d{5}-?\d{3}$/, "CEP inválido")
    .transform((val) => val.replace("-", ""))
    .describe("CEP, formato 00000000"),
  street: z.string().min(3).max(150).describe("Logradouro"),
  number: z.string().min(1).max(20).describe("Número (aceita 'S/N')"),
  complement: z.string().max(100).optional().describe("Complemento"),
  neighborhood: z.string().min(2).max(100).describe("Bairro"),
  city: z.string().min(2).max(100).describe("Cidade"),
  state: z.enum([
    "AC","AL","AP","AM","BA","CE","DF","ES","GO",
    "MA","MT","MS","MG","PA","PB","PR","PE","PI",
    "RJ","RN","RS","RO","RR","SC","SP","SE","TO",
  ]).describe("UF"),
});

export const CnpjSchema = z.string()
  .transform(unmaskCnpj)
  .refine(isValidCnpj, { message: "CNPJ inválido" });

export const CompanySchema = z.object({
  name: z.string().min(2).max(150).describe("Nome"),
  cnpj: CnpjSchema,
  tradeName: z.string().min(2).max(150).describe("Nome Fantasia"),
  address: AddressSchema,
});

export type Address = z.infer<typeof AddressSchema>;
export type Company = z.infer<typeof CompanySchema>;
```

## Schema Prisma (`apps/api/prisma/schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Company {
  id        String   @id @default(uuid())
  name      String
  cnpj      String   @unique
  tradeName String
  address   Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("companies")
}
```

Notas:
- `cnpj` é `@unique` — o backend rejeita cadastro duplicado com 409/400.
- `createdAt`/`updatedAt` mapeiam diretamente para `CriadoEm`/`AlteradoEm`
  do PDF — nomes de campo em inglês (decisão em `10-CONVENTIONS.md`),
  significado idêntico ao exigido.
- Colunas em camelCase nativo (sem `@map` para snake_case — decisão
  tomada em conversa).

## Validação de CNPJ

Algoritmo de módulo 11 (dois dígitos verificadores), implementado em
`packages/shared/src/validators/cnpj.ts`, com testes unitários
cobrindo: CNPJ válido com/sem máscara, DV incorreto, tamanho inválido,
sequência repetida, entrada não numérica. Detalhes de implementação em
`09-DECISIONS.md`.
