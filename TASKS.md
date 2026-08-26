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
> Postgres local publica na porta **5433** do host (a 5432 já era usada
> por outro container da máquina) — o `DATABASE_URL` de
> `apps/api/.env.example` reflete isso.

## Backend

- [ ] `todo` — Log de auditoria em MongoDB (eventos de escrita do CRUD + `GET /audit-logs`)

- [x] `done` — Schema Prisma: Company (migration `init` aplicada, tabela `companies`)
- [x] `done` — Schemas Zod compartilhados: Company, Address, Cnpj
- [x] `done` — CnpjValidator + testes unitários (11 casos, `pnpm --filter @kpmg/shared test`)
- [x] `done` — CRUD Company (controller + service + DTOs via nestjs-zod)
- [x] `done` — `GET /companies` com `search` e `state` (ver `docs/03-API-SPEC.md`)
- [x] `done` — EmailService (Resend) + mock via DI nos testes unitários
- [x] `done` — Testes e2e do CRUD (supertest)
- [x] `done` — Teste e2e confirmando ausência de autenticação
- [x] `done` — Swagger via nestjs-zod em `/docs`
- [x] `done` — Health check `GET /health`
- [x] `done` — Exception filter global

> Verificação manual fim-a-fim contra o Postgres local (curl em todos os
> endpoints: 201/400/409/404/204, `?search=` com CNPJ mascarado, `?state=`,
> Swagger em `/docs`, e-mail best-effort logado sem `RESEND_API_KEY`).
> `VITE_API_MOCK` removido — o frontend roda contra a API real.
> Unitários: 10 testes em `company.service.spec.ts` + 11 do CNPJ.
> E2E: 16 testes em `apps/api/test/company.e2e-spec.ts` contra o banco
> isolado `kpmg_teste_test` (`.env.test` carregado via
> `test/jest-e2e.setup.ts`; migrar com
> `DATABASE_URL=...kpmg_teste_test pnpm --filter api prisma migrate deploy`).

## Frontend

- [x] `done` — Design tokens Tailwind a partir de `docs/design.md`
- [x] `done` — `CompanyListPage`
- [x] `done` — `CompanyFormPage` (create + edit)
- [x] `done` — Hook `useCepLookup` (ViaCEP + fallback)
- [x] `done` — Client HTTP para a API
- [x] `done` — Toasts, modal de confirmação, empty state

> Nota: as telas seguem o protótipo do Claude Design
> (`KPMG Technical Design Implementation/`). O mock em memória
> (`VITE_API_MOCK`, ver `docs/09-DECISIONS.md`) foi desligado quando a API
> real entrou — as páginas seguem dependendo só da interface `CompanyApi`.

## Infra / Deploy

- [x] `done` — CI (lint + testes + build) + release na VPS (push imagem GHCR + deploy via deployctl)
- [x] `done` — Deploy backend na VPS (modelo vps-infra: `kpmg-api` + `kpmg-postgres` + job `migrate`)
- [x] `done` — Deploy frontend na Vercel
- [x] `done` — CORS configurado entre os dois domínios
- [x] `done` — `prisma migrate deploy` automatizado (job `migrate` antes de cada swap)
- [x] `done` — Seed de produção (4 empresas; script reprodutível em `apps/api/prisma/seed.js`)

> **Produção no ar**: frontend em `https://kpmg-test-frontend.vercel.app`,
> backend em `https://kpmg.devarthur.com.br` (Swagger em `/docs`).
> Deploys automáticos a cada merge na `main` (job `release` do CI).
> Pendente apenas: `RESEND_API_KEY` real no `secrets.env` da VPS (sem
> ela o envio de e-mail é pulado com log, sem quebrar o cadastro).

## Documentação

- [x] `done` — Todos os docs de planejamento (`docs/*.md`)
- [x] `done` — `docs/status/` (o que está pronto + lições da suíte de testes)
- [x] `done` — `README.md` raiz (setup local, links de deploy/Swagger, badge de CI)
