# AGENTS.md

Instruções canônicas para qualquer agente de IA (Claude Code, Kimi K2,
GPT/Codex, ou outro) trabalhando neste repositório. Este é o único
arquivo de contexto — `CLAUDE.md` apenas aponta para cá, evitando
duplicação e divergência entre os dois.

## Antes de tudo

1. Leia `docs/CONSTRAINTS.md` — restrições inegociáveis (sem autenticação).
2. Leia `TASKS.md` — o que já foi feito e qual é a próxima tarefa acionável.
3. Consulte o documento específico da camada em que for trabalhar
   (tabela abaixo) antes de escrever qualquer código.

## Mapa de documentação

| Arquivo | Quando consultar |
|---|---|
| `docs/00-CONTEXT.md` | Entender o objetivo geral do projeto |
| `docs/01-REQUIREMENTS.md` | Confirmar o que é exigido vs. diferencial |
| `docs/02-DATA-MODEL.md` | Schema Prisma e Zod |
| `docs/03-API-SPEC.md` | Contrato de endpoints, DTOs, formato de erro |
| `docs/04-ARCHITECTURE.md` | Como frontend/backend/db/email se comunicam |
| `docs/05-FRONTEND-SPEC.md` | Telas, rotas, comportamento de UI |
| `docs/06-EMAIL-NOTIFICATIONS.md` | Regras de disparo de e-mail |
| `docs/07-TESTING-STRATEGY.md` | O que testar e como mockar |
| `docs/08-DEPLOYMENT.md` | Deploy, CI/CD, variáveis de ambiente |
| `docs/09-DECISIONS.md` | Raciocínio por trás de cada decisão |
| `docs/10-CONVENTIONS.md` | Nomenclatura — **leitura obrigatória antes de nomear qualquer coisa** |
| `docs/11-DEFESA-TECNICA.md` | Perguntas prováveis do avaliador e as respostas, com links para a fonte de cada uma |
| `docs/CONSTRAINTS.md` | O que NÃO implementar (autenticação) |
| `docs/design.md` | Tokens visuais para o frontend |
| `docs/status/` | O que já está implementado e verificado (fotografia atual) |

## Stack (resumo — detalhes nos docs acima)

- **Backend**: NestJS + Prisma + PostgreSQL + Zod (`nestjs-zod`) + Resend.
- **Frontend**: React + Vite + Tailwind + React Router + React Hook Form.
- **Compartilhado**: `packages/shared` — schemas Zod e validadores
  usados por backend e frontend.
- **Monorepo**: pnpm workspaces.

## Sobre o protótipo do Claude Design

Se um arquivo `.dc.html`/`support.js` (saída do Claude Design) estiver
disponível no repositório ou em anexo, ele é **referência visual e de
comportamento** — cores, radius, textos de erro/empty state, fluxo de
interação. **Não é código de produção**: não copie/porte a estrutura
JS dali para o React real. A implementação segue `05-FRONTEND-SPEC.md`,
`design.md` e `10-CONVENTIONS.md`, usando a stack definida (React,
Tailwind, React Hook Form, Zod de `packages/shared`), não a stack do
protótipo.

## Regras de execução

- Nunca implemente autenticação, mesmo que pareça "mais completo"
  (ver `docs/CONSTRAINTS.md`).
- Sempre importe validação de `packages/shared` — nunca duplique regra
  de negócio entre frontend e backend.
- Siga `docs/10-CONVENTIONS.md` à risca para nomes de arquivo, classe,
  variável e função — nomes completos, nunca abreviados.
- Ao concluir uma tarefa, atualize o status em `TASKS.md`. Decisões
  técnicas novas e relevantes vão para `docs/09-DECISIONS.md`, não para
  `TASKS.md` (que é só fila de trabalho, não histórico de raciocínio).
- Backend sempre revalida o que o frontend envia — nunca confie em
  validação client-side como fonte de verdade.

## Como rodar localmente

```bash
pnpm install
docker compose up -d          # sobe Postgres local
pnpm --filter api exec prisma migrate dev
pnpm --filter api dev         # backend em localhost:3000
pnpm --filter web dev         # frontend em localhost:5173
```

## Como testar

```bash
pnpm --filter api test        # unitários
pnpm --filter api test:e2e    # e2e (requer banco de teste)
```
