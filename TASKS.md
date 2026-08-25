# TASKS.md — Estado do Projeto

> Qualquer agente (Claude, Kimi K2, GPT), ao iniciar uma sessão neste
> projeto, deve ler este arquivo primeiro para entender o que já foi
> feito e qual é a próxima tarefa. Ao concluir uma tarefa, marque como
> `done` e adicione uma nota curta se algo relevante mudou (decisões
> reais de arquitetura vão para `docs/09-DECISIONS.md`, não aqui).

## Convenção de status

`todo` → `in-progress` → `done` | `blocked` (com motivo)

## Setup / Scaffold

- [x] `done` — Bootstrap do monorepo (estrutura de pastas, pnpm workspace)
- [x] `done` — Setup NestJS em `apps/api`
- [x] `done` — Setup React + Vite + Tailwind em `apps/web`
- [x] `done` — Setup `packages/shared`
- [x] `done` — `docker-compose.yml` com Postgres local
- [x] `done` — `.env.example` em cada app

> Nota: `apps/api` consome `@kpmg/shared` via build (`dist/`) — rodar
> `pnpm --filter @kpmg/shared build` antes de subir a API. O frontend usa
> o fonte direto, via alias no `vite.config.ts` (ver `09-DECISIONS.md`),
> e não precisa do build.
>
> Pendências do bootstrap, ainda abertas: `prisma init` não foi rodado
> (não existe `apps/api/prisma/schema.prisma`), `@nestjs/swagger` não foi
> instalado, e as pastas `src/modules/company/`, `src/email/` e
> `src/common/filters/` ainda não existem.

## Backend

- [ ] `todo` — Schema Prisma: Company (ver `docs/02-DATA-MODEL.md`)
- [x] `done` — Schemas Zod compartilhados: Company, Address, Cnpj
- [x] `done` — CnpjValidator + testes unitários (11 casos, `pnpm --filter @kpmg/shared test`)
- [ ] `todo` — CRUD Company (controller + service + DTOs via nestjs-zod)
- [ ] `todo` — `GET /companies` com `search` e `state` (ver `docs/03-API-SPEC.md`)
- [ ] `todo` — EmailService (Resend) + implementação mock para testes
- [ ] `todo` — Testes e2e do CRUD (supertest)
- [ ] `todo` — Teste e2e confirmando ausência de autenticação
- [ ] `todo` — Swagger via nestjs-zod em `/docs`
- [ ] `todo` — Health check `GET /health`
- [ ] `todo` — Exception filter global

## Frontend

- [x] `done` — Design tokens Tailwind a partir de `docs/design.md`
- [x] `done` — `CompanyListPage`
- [x] `done` — `CompanyFormPage` (create + edit)
- [x] `done` — Hook `useCepLookup` (ViaCEP + fallback)
- [x] `done` — Client HTTP para a API
- [x] `done` — Toasts, modal de confirmação, empty state

> Nota: as telas seguem o protótipo do Claude Design
> (`KPMG Technical Design Implementation/`). Enquanto a API não existe,
> `VITE_API_MOCK=true` liga uma implementação em memória — ver
> `docs/09-DECISIONS.md`. Trocar para a API real é só apagar a variável.

## Infra / Deploy

- [ ] `todo` — CI (GitHub Actions: lint + testes + build + push imagem)
- [ ] `todo` — Deploy backend na VPS (Docker + Caddy + Cloudflare Tunnel)
- [ ] `todo` — Deploy frontend na Vercel
- [ ] `todo` — CORS configurado entre os dois domínios
- [ ] `todo` — `prisma migrate deploy` automatizado no CI
- [ ] `todo` — Seed de produção

## Documentação

- [x] `done` — Todos os docs de planejamento (`docs/*.md`)
- [ ] `todo` — `README.md` raiz (setup local, links de deploy/Swagger, badge de CI)
