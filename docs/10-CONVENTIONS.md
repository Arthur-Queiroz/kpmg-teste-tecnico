# Convenções de Código

Regra geral: **nomes sempre legíveis e completos, nunca abreviados para
economizar caracteres**. `company` em vez de `comp`, `address` em vez
de `addr`, `quantity` em vez de `qty`. Um nome mais longo e claro
sempre vence um nome curto e ambíguo.

## Idioma

- **Identificadores de código** (classes, variáveis, funções, campos):
  inglês. Exceção: `CNPJ` — termo jurídico brasileiro sem tradução
  fiel, mantido como está.
- **Comentários e JSDoc**: inglês, por consistência com o código.
- **UI (labels, mensagens, textos visíveis)**: português — idioma do
  usuário final da aplicação.
- **Documentação (`docs/*.md`)**: português — idioma da conversa com o
  avaliador.

## Arquivos e Pastas

- **kebab-case** para todos os nomes de arquivo:
  `company.controller.ts`, `company.service.ts`, `cnpj.validator.ts`.
- Sufixo do arquivo reflete seu papel (padrão NestJS):
  `.controller.ts`, `.service.ts`, `.module.ts`, `.dto.ts`,
  `.validator.ts`, `.guard.ts`, `.pipe.ts`, `.interceptor.ts`.
- Testes:
  - Unitário: mesmo nome do arquivo testado + `.spec.ts`.
  - E2E: `.e2e-spec.ts`, na pasta `test/` na raiz do app.
- Pastas de módulo: nome da entidade no singular, kebab-case
  (`src/modules/company/`, não `companies` nem `Company`).

## Classes (Backend — NestJS)

PascalCase, sufixo indicando o papel:

| Papel | Exemplo |
|---|---|
| Controller | `CompanyController` |
| Service | `CompanyService` |
| Module | `CompanyModule` |
| DTO (via nestjs-zod) | `CreateCompanyDto`, `UpdateCompanyDto` |
| Exception customizada | `InvalidCnpjException` |

## Funções e Métodos

camelCase, começando com verbo que descreve a ação:

- CRUD: `create`, `findAll`, `findOne`, `update`, `remove`.
- Validadores: prefixo `is`/`has` para retorno booleano —
  `isValidCnpj`, `hasValidAddress`.
- Nunca abreviar o nome do método: `calculateVerificationDigit`, não
  `calcDV`.

## Variáveis

camelCase, nome descreve o **conteúdo**, não o tipo:

```ts
// evitar
const arr = companies.filter(c => c.active);

// preferir
const activeCompanies = companies.filter((company) => company.active);
```

- Booleans: prefixo `is`, `has`, `should` — `isLoading`, `hasError`.
- Arrays: nome no plural — `companies`, `emailRecipients`.
- Evitar nomes de uma letra, exceto índice de loop trivial quando não
  há alternativa mais clara.

## Constantes

- Constante verdadeiramente imutável, de módulo/config:
  `UPPER_SNAKE_CASE` — `MAX_UPLOAD_SIZE_MB`, `DEFAULT_PAGE_SIZE`.
- Constante local dentro de função: camelCase normal.

## Zod (schemas compartilhados em `packages/shared`)

PascalCase + sufixo `Schema`, tipo inferido sempre exportado junto:

```ts
export const CompanySchema = z.object({ ... });
export type Company = z.infer<typeof CompanySchema>;
```

## Prisma (`schema.prisma`)

- Model: PascalCase, singular — `model Company { ... }`.
- Campos: camelCase nativo (sem `@map` para snake_case).
- Relações: nome do campo reflete a entidade relacionada.

## React (Frontend)

- Componentes: PascalCase, arquivo com mesmo nome —
  `CompanyForm.tsx`, `CompanyList.tsx`.
- Hooks customizados: prefixo `use`, camelCase — `useCepLookup.ts`.
- Páginas/rotas: sufixo `Page` quando ambíguo com componente comum —
  `CompanyListPage.tsx`.
- Props de componente: interface com sufixo `Props` —
  `interface CompanyFormProps { ... }`.

## Imports

Ordem, com linha em branco entre grupos:
1. Bibliotecas externas (`react`, `@nestjs/common`, `zod`).
2. Imports de `packages/shared` (workspace interno).
3. Imports relativos do próprio módulo.

## Regra geral final

Se ao escrever um nome a dúvida for "abrevio ou deixo completo?", a
resposta é sempre **deixo completo**. Legibilidade > economia de
caracteres, sempre, neste projeto.
