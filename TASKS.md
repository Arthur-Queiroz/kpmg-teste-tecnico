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

> Nota: `packages/shared` (`@kpmg/shared`) é consumido via build (`dist/`)
> — rodar `pnpm --filter @kpmg/shared build` (ou `dev` em watch) antes de
> subir api/web. Tailwind v4 via `@tailwindcss/vite`; tokens de
> `docs/design.md` ainda não aplicados (tarefa de frontend).

## Backend

- [ ] `todo` — Schema Prisma: Company (ver `docs/02-DATA-MODEL.md`)
- [ ] `todo` — Schemas Zod compartilhados: Company, Address, Cnpj
- [ ] `todo` — CnpjValidator + testes unitários
- [ ] `todo` — CRUD Company (controller + service + DTOs via nestjs-zod)
- [ ] `todo` — EmailService (Resend) + implementação mock para testes
- [ ] `todo` — Testes e2e do CRUD (supertest)
- [ ] `todo` — Teste e2e confirmando ausência de autenticação
- [ ] `todo` — Swagger via nestjs-zod em `/docs`
- [ ] `todo` — Health check `GET /health`
- [ ] `todo` — Exception filter global

## Frontend

- [ ] `todo` — Design tokens Tailwind a partir de `docs/design.md`
- [ ] `todo` — `CompanyListPage`
- [ ] `todo` — `CompanyFormPage` (create + edit)
- [ ] `todo` — Hook `useCepLookup` (ViaCEP + fallback)
- [ ] `todo` — Client HTTP para a API
- [ ] `todo` — Toasts, modal de confirmação, empty state

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
