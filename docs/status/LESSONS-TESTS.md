# Investigação da suíte de testes — problemas encontrados e correções

> Auditoria feita ao preparar os testes para CI (2026-08-25). Cada item
> descreve o sintoma, a causa e a correção aplicada.

## 1. `.env.test` estava ignorado pelo git

**Sintoma**: o e2e só rodava na máquina que criou o arquivo — um clone
novo (ou o CI) não teria o `DATABASE_URL` do banco de teste.
**Causa**: o `.gitignore` raiz tinha `.env.test` na lista de ignorados.
**Correção**: removido do `.gitignore` (o arquivo só contém credenciais
locais do Postgres de teste, sem segredo real). O setup
(`test/jest-e2e.setup.ts`) usa `override: true` de propósito: garante que
a suíte **sempre** aponte para o banco de teste, mesmo que o `.env` de
desenvolvimento mude.

## 2. ts-jest não pegava erros de tipo nos testes

**Sintoma**: o e2e passava mesmo com imports de tipo quebrados
(`Response` de `supertest/types`, que não existe; `dotenv` não declarado
como dependência direta e invisível para o pnpm).
**Causa**: com `isolatedModules: true` no tsconfig, o ts-jest compila em
modo transpile-only — não faz type-check.
**Correção**: corrigidos os dois imports (`Response` substituído por
`{ body: unknown }` no helper `bodyAs`; `dotenv` adicionado como
devDependency) e criado o script `pnpm --filter api typecheck`
(`tsc --noEmit -p tsconfig.json`), que cobre `src/` e `test/` e roda no
CI.

## 3. Regra de lint estrita vs. `response.body` do supertest

**Sintoma**: ~30 erros `no-unsafe-member-access` no e2e.
**Causa**: `response.body` do supertest é `any`, e o eslint do projeto
usa `recommendedTypeChecked`.
**Correção**: helper `bodyAs<T>(response)` tipando cada corpo de resposta
(`CompanyRecord`, `CompanyListBody`, `ErrorBody`) — mantém o lint
estrito sem desabilitar regra.

## 4. Suíte e2e deixava lixo no banco de teste

**Sintoma**: após a corrida, o último `POST` da suíte permanecia na
tabela `companies` do `kpmg_teste_test`.
**Correção**: `afterAll` agora limpa a tabela antes de fechar a app (o
`beforeEach` já limpava **entre** os testes).

## 5. Dependência de ordem: api precisa do `dist/` do shared

**Sintoma**: em clone limpo, os testes unitários da api falhariam ao
importar `@kpmg/shared` (o `main` aponta para `dist/index.js`, que não
existiria).
**Correção**: o CI builda `packages/shared` antes de qualquer passo da
api; localmente já estava documentado no `TASKS.md`.

## 6. Porta do Postgres: 5433, não 5432

A 5432 do host de desenvolvimento pertence a outro container Docker
(outro projeto do autor). O compose publica `5433:5432`, e o
`.env.test`/workflow de CI usam a mesma porta para o banco de teste.
Contexto completo em `docs/09-DECISIONS.md`.

## O que **não** é problema (verificado)

- `pnpm test` na raiz: o pnpm ignora automaticamente pacotes sem script
  `test` (o `web` não tem — testes de frontend são fora de escopo, ver
  `07-TESTING-STRATEGY.md`).
- E-mail no e2e: `EmailService` é substituído por mock via
  `overrideProvider`, então a suíte nunca bate no Resend real.
- Isolamento de banco: confirmado por inspeção direta — a suíte escreve
  só em `kpmg_teste_test`; o banco de dev fica intacto.
