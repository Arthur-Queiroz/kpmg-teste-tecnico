# Estratégia de Testes

Exigido pelo PDF apenas no **backend**. Frontend não tem testes
automatizados exigidos ou planejados neste projeto.

## Ferramentas

- **Jest** (padrão NestJS, já vem configurado pelo Nest CLI).
- **Supertest** para testes e2e HTTP.

## Testes unitários

- `packages/shared/src/validators/cnpj.spec.ts` — validação isolada de
  CNPJ (válido/inválido, com/sem máscara, sequência repetida, tamanho
  incorreto). Ver casos detalhados em `09-DECISIONS.md`.
- `apps/api/src/modules/company/company.service.spec.ts` — lógica de
  negócio isolada, com `PrismaService` e `EmailService` mockados
  (não bate em banco real nem em Resend real).

## Testes e2e

`apps/api/test/company.e2e-spec.ts`, contra um banco de teste real
(Postgres via Docker Compose, isolado do banco de desenvolvimento),
cobrindo:

- `POST /companies` — cria empresa válida → 201.
- `POST /companies` com CNPJ inválido → 400.
- `POST /companies` com CNPJ duplicado → 409.
- `GET /companies` — lista paginada.
- `GET /companies/:id` — 200 e 404.
- `PATCH /companies/:id` — atualiza com sucesso, não dispara e-mail.
- `DELETE /companies/:id` — 204 e 404.
- **Validação do envio de e-mail** (requisito explícito do PDF): após
  `POST /companies` bem-sucedido, o mock de `EmailService` foi chamado
  exatamente uma vez, com os dados corretos da empresa criada.
- `GET /companies` sem nenhum header de autorização → 200 (confirma
  deliberadamente a ausência de autenticação, ver `CONSTRAINTS.md`).

## Isolamento de dados de teste

Banco de teste separado do banco de desenvolvimento/produção
(`DATABASE_URL` diferente via `.env.test`), limpo entre suítes
(`beforeEach`/`afterAll` truncando tabelas relevantes).

## CI

Testes rodam automaticamente a cada push via GitHub Actions (ver
`08-DEPLOYMENT.md`) — badge de status no `README.md` raiz como prova
visível para o avaliador.

## Fora de escopo

- Testes de frontend (explicitamente dispensados pelo PDF).
- Testes de carga/performance.
- Testes e2e de UI (Playwright/Cypress) — não exigidos.
