# Status da Implementação

> Fotografia do que está **pronto e verificado** no projeto, com os
> comandos para reproduzir cada verificação. A fila do que falta fica em
> `TASKS.md` (raiz); o raciocínio das decisões em `docs/09-DECISIONS.md`.
> Este documento é sobre o que já existe e funciona.

Última atualização: 2026-08-25.

## Visão geral

| Camada | Estado | Verificação |
|---|---|---|
| Monorepo (pnpm workspaces) | Pronto | `pnpm install` |
| `packages/shared` (schemas Zod + CNPJ) | Pronto, 11 testes | `pnpm --filter @kpmg/shared test` |
| Banco local (Postgres via compose) | Pronto | `docker compose up -d` |
| Schema Prisma + migration | Pronto | tabela `companies` criada |
| Backend (CRUD completo) | Pronto, 10 unit + 16 e2e | ver "Como verificar" abaixo |
| Frontend (2 telas completas) | Pronto, contra a API real | `pnpm --filter web dev` |
| CI (lint + testes + build + release) | Pronto (`.github/workflows/ci.yml`) | push em `main` |
| Deploy backend (VPS, modelo vps-infra) | **No ar** | `https://kpmg.devarthur.com.br/health` |
| Deploy frontend (Vercel) | **No ar** | `https://kpmg-test-frontend.vercel.app` |
| Seed de produção | Pronto (4 empresas) | `GET /companies` → `total: 4` |
| Envio de e-mail (Resend) | Pendente: falta `RESEND_API_KEY` real | envio é pulado com log sem quebrar |

## O que está pronto, por camada

### `packages/shared`

- `AddressSchema`, `CompanySchema`, `CnpjSchema`, `CompanyRecordSchema`
  (`src/schemas/`) — única fonte de verdade de validação, consumida pelo
  backend (via `dist/` buildado) e pelo frontend (via alias para o fonte,
  ver `docs/09-DECISIONS.md`).
- `isValidCnpj` / `unmaskCnpj` (`src/validators/cnpj.ts`) — módulo 11
  completo, com 11 testes unitários cobrindo máscara, DV incorreto,
  tamanho, sequência repetida e entrada não numérica.

### Backend (`apps/api`)

- **CRUD completo** em `src/modules/company/`, com DTOs gerados por
  `createZodDto()` a partir dos schemas compartilhados — nenhuma regra de
  validação duplicada.
- **Listagem paginada** com `search` (nome, nome fantasia e CNPJ — com ou
  sem máscara) e `state` (filtro sobre `address.state`, coluna `Json`),
  aplicados no servidor sobre o conjunto inteiro.
- **E-mail best-effort** (`src/email/`): `EmailService` abstrata com
  implementação Resend; falha de envio é logada, nunca derruba o cadastro;
  sem `RESEND_API_KEY` o envio é pulado com warning (dev local).
- **Formato de erro global** (`src/common/filters/http-exception.filter.ts`)
  conforme `docs/03-API-SPEC.md`, preservando o array `errors` do Zod que o
  frontend usa para mapear erro por campo.
- **`GET /health`** e **Swagger em `/docs`** (nestjs-zod 5 +
  `cleanupOpenApiDoc`).
- **Sem autenticação**, por exigência do PDF — provado por teste e2e.
- Migration `init` aplicada localmente; banco de teste isolado
  (`kpmg_teste_test`) criado pelo `docker/init-db.sql`.

### Frontend (`apps/web`)

- `CompanyListPage` (listagem, busca, filtro por UF, paginação, empty
  states, modal de exclusão) e `CompanyFormPage` (create + edit, dois
  blocos visuais, validação via `CompanySchema` compartilhado).
- `useCepLookup` (ViaCEP direto do browser, debounce, AbortController,
  fallback manual que nunca bloqueia o cadastro).
- Client HTTP com `ApiError` tipado (erros por campo no formato do React
  Hook Form) — roda contra a API real; o mock `VITE_API_MOCK` foi
  desligado quando o backend entrou.

### Testes

| Suíte | Comando | Cobertura |
|---|---|---|
| CNPJ (shared) | `pnpm --filter @kpmg/shared test` | 11 casos |
| `CompanyService` (unit) | `pnpm --filter api test` | 10 casos, Prisma/Email mockados |
| CRUD e2e | `pnpm --filter api test:e2e` | 16 casos, Postgres real isolado |

Detalhes do que cada suíte cobre: `docs/07-TESTING-STRATEGY.md`.
Problemas encontrados ao montar a suíte e2e e como foram resolvidos:
`docs/status/LESSONS-TESTS.md`.

## Como verificar o backend localmente

```bash
docker compose up -d                          # Postgres local (porta 5433 do host)
pnpm --filter @kpmg/shared build              # api consome o dist/
pnpm --filter api exec prisma migrate dev          # cria/atualiza a tabela
pnpm --filter api dev                         # API em localhost:3000
pnpm --filter web dev                         # frontend em localhost:5173
```

Endpoints: `GET/POST /companies`, `GET/PATCH/DELETE /companies/:id`,
`GET /health`, Swagger em `http://localhost:3000/docs`.

## CI/CD

`.github/workflows/ci.yml` roda em push/PR para `main`: install com cache
pnpm, build do shared, lint (api + web), typecheck da api, testes
unitários (shared + api), `prisma migrate deploy` contra um Postgres
efêmero de service container e os 16 testes e2e, finalizando com build
dos dois apps. Na `main`, o job `release` (gated por `DEPLOY_ENABLED=true`)
chama o reusable workflow `Arthur-Queiroz/vps-deploy`: build+push da
imagem no GHCR por digest e `deployctl release kpmg api sha256:<digest>`
via chave SSH confinada — o job `migrate` do manifesto roda
`prisma migrate deploy` antes de cada swap do container. Detalhes do
modelo em `docs/08-DEPLOYMENT.md`.
