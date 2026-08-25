# Prompt de Bootstrap — Uso único, no início do projeto local

Cole este prompt no agente (Claude Code, Kimi K2, etc.), na pasta onde
o `docs.zip` já foi extraído (com `docs/`, `AGENTS.md`, `CLAUDE.md`,
`TASKS.md` na raiz).

---

Você vai fazer o **bootstrap** deste projeto. Sua tarefa é **apenas
estrutural** — criar pastas, instalar dependências e deixar o projeto
pronto para rodar `dev`, sem implementar nenhuma lógica de negócio
ainda (isso vem depois, guiado por `TASKS.md`).

## 1. Leia primeiro, nesta ordem

1. `AGENTS.md`
2. `docs/CONSTRAINTS.md`
3. `docs/04-ARCHITECTURE.md`
4. `docs/10-CONVENTIONS.md`

## 2. Estrutura de pastas a criar

```
.
├── apps/
│   ├── api/
│   └── web/
├── packages/
│   └── shared/
├── docs/              (já existe, não mexer)
├── AGENTS.md          (já existe)
├── CLAUDE.md           (já existe)
├── TASKS.md            (já existe)
├── pnpm-workspace.yaml
├── package.json        (raiz, workspace root)
├── .gitignore
└── docker-compose.yml  (Postgres local)
```

## 3. `packages/shared`

- Inicialize como pacote TypeScript simples (`package.json` + `tsconfig.json`).
- Dependência: `zod`.
- Crie a estrutura de pastas vazia: `src/schemas/`, `src/validators/`.
- **Não implemente os schemas ainda** — só a estrutura, um
  `src/index.ts` vazio exportando nada ainda. A implementação real dos
  schemas/validators é uma tarefa separada em `TASKS.md`.

## 4. `apps/api`

- Gere com o Nest CLI (`nest new api --package-manager pnpm`,
  adaptando o path para dentro de `apps/`).
- Instale: `@nestjs/swagger`, `prisma`, `@prisma/client`, `nestjs-zod`,
  `zod`, `resend`.
- Instale como dependência de workspace: `packages/shared`.
- Rode `npx prisma init` dentro de `apps/api` (datasource postgresql).
- Crie a estrutura de pastas vazia conforme `docs/10-CONVENTIONS.md`:
  `src/modules/company/`, `src/email/`, `src/common/filters/`.
- **Não implemente controllers/services/schema Prisma ainda** — isso é
  tarefa separada em `TASKS.md`.
- Configure scripts no `package.json`: `dev`, `build`, `test`, `test:e2e`.

## 5. `apps/web`

- Gere com Vite (`pnpm create vite web --template react-ts`,
  adaptando o path para dentro de `apps/`).
- Instale: `tailwindcss` (+ setup), `react-router-dom`,
  `react-hook-form`, `@hookform/resolvers`, `zod`.
- Instale como dependência de workspace: `packages/shared`.
- Configure Tailwind com os tokens de cor/spacing/radius de
  `docs/design.md` no `tailwind.config.ts` (isso pode ser feito agora,
  é configuração, não lógica de negócio).
- Crie a estrutura de pastas vazia: `src/pages/`, `src/components/`,
  `src/hooks/`, `src/api/`.
- **Não implemente páginas/componentes ainda** — tarefa separada.

## 6. Raiz do monorepo

- `pnpm-workspace.yaml`:
  ```yaml
  packages:
    - "apps/*"
    - "packages/*"
  ```
- `package.json` raiz com scripts de conveniência:
  ```json
  {
    "scripts": {
      "dev:api": "pnpm --filter api dev",
      "dev:web": "pnpm --filter web dev",
      "test:api": "pnpm --filter api test"
    }
  }
  ```
- `.gitignore`: `node_modules`, `dist`, `.env`, `.env.local`.
- `docker-compose.yml` — um serviço `postgres`, porta `5432`, volume
  nomeado, variáveis de ambiente básicas para desenvolvimento local
  (usuário/senha/db de dev, **nunca** valores de produção).
- `.env.example` em `apps/api` e `apps/web`, com as variáveis listadas
  em `docs/08-DEPLOYMENT.md` (sem valores reais, só os nomes).

## 7. Ao final

- Rode `pnpm install` na raiz e confirme que resolve sem erro.
- Rode `docker compose up -d` e confirme que o Postgres sobe.
- **Não** rode `prisma migrate dev` ainda (não há schema definido).
- Atualize `TASKS.md`: marque a seção "Setup / Scaffold" inteira como
  `done`, deixe o resto como está.
- Não crie nenhum arquivo de código de negócio (controllers, services,
  componentes React) além do boilerplate gerado pelas próprias
  ferramentas (Nest CLI, Vite). O próximo agente que abrir o projeto
  vai continuar a partir de `TASKS.md`.
