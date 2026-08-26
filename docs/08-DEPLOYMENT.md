# Deployment

## Topologia

- **Frontend**: React (Vite), deploy na **Vercel**, build estático.
- **Backend**: NestJS, containerizado (Docker), deploy na **VPS
  Hostinger KVM2** (Debian 13), exposto via Cloudflare Tunnel + Caddy
  em `kpmg.devarthur.com.br`. O deploy segue o modelo vps-infra
  (manifesto `apps/kpmg.yaml` no repo vps-infra, releases por digest via
  `deployctl`).
- **Bancos de dados**: Postgres 16 (domínio: empresas) e MongoDB 7
  (log de auditoria das escritas), ambos serviços `stateful`
  **dedicados ao app** (containers `kpmg-postgres`/`kpmg-mongo` na rede
  interna `net-kpmg`, volumes em `/var/lib/vps-apps/kpmg/`). Não são
  expostos publicamente: só acessíveis pelo backend, na rede interna do
  app.
  (O planejamento original previa um database na instância Postgres
  compartilhada da VPS — a mudança está justificada em
  `09-DECISIONS.md`.)
- **Migrations**: `prisma migrate deploy` roda como job `migrate` do
  manifesto, antes de cada swap do serviço `api` — falha aborta o
  release com produção intacta (nunca `migrate dev`).

## Por que VPS própria em vez de Railway/Supabase

Decisão registrada em `09-DECISIONS.md`: infraestrutura que o autor já
opera e monitora (Uptime Kuma) evita riscos de cold start, hibernação
por inatividade, ou limite de conexões de free tier de serviços
gerenciados — relevante numa janela de avaliação onde o avaliador pode
acessar a qualquer momento sem aviso prévio.

## CI/CD (GitHub Actions)

Pipeline dispara em push para `main` (`.github/workflows/ci.yml`):

1. Instala dependências (pnpm workspace, cache habilitado).
2. Build de `packages/shared` + `prisma generate` (postinstalls não rodam
   sob o pnpm — ver `docs/status/LESSONS-TESTS.md`).
3. Roda lint + typecheck + testes unitários (`apps/api` e
   `packages/shared`) e e2e contra Postgres service container.
4. Build dos dois apps.
5. **Release** (só na `main`, com `DEPLOY_ENABLED=true`): o job chama o
   reusable workflow `Arthur-Queiroz/vps-deploy`, que faz build+push da
   imagem no GHCR **por digest** e dispara `deployctl release kpmg api
   sha256:<digest>` via chave SSH confinada (`deploy-kpmg`).
6. Na VPS, o `deployctl` roda o job `migrate` (`prisma migrate deploy`
   com a mesma imagem do release) **antes** do swap do container — falha
   de migration aborta o release com produção intacta. Nunca
   `migrate dev`.

Frontend: pipeline nativo da Vercel (deploy automático por push/PR),
sem necessidade de step manual no GitHub Actions. Build configurado no
repositório via `vercel.json`.

## Configuração da Vercel

Fica versionada em `vercel.json`, na raiz — não no dashboard — para que
o build seja reproduzível e revisável junto do código:

| Campo | Valor | Por quê |
|---|---|---|
| `installCommand` | `pnpm install --frozen-lockfile` | Mesma instalação do CI, workspace inteiro |
| `buildCommand` | `pnpm --filter web build` | O `apps/web` importa `packages/shared` pelo fonte, então o build precisa rodar da raiz do workspace |
| `outputDirectory` | `apps/web/dist` | Saída do Vite |
| `rewrites` | tudo → `/index.html` | Sem isso, um F5 em `/companies/new` ou `/companies/:id/edit` devolve 404: as rotas existem só no React Router, não como arquivos |

Por isso o **Root Directory do projeto na Vercel deve continuar sendo a
raiz do repositório** (`.`), e não `apps/web` — os comandos acima já
apontam para o app certo, e a raiz é onde vivem o `pnpm-workspace.yaml`
e o `packages/shared`.

`VITE_API_URL` é **build-time**: mudar a variável na Vercel exige um
novo deploy para ter efeito, não basta reiniciar.

## Variáveis de ambiente

| Variável | Onde | Exemplo |
|---|---|---|
| `DATABASE_URL` | VPS (backend) | `postgresql://user:pass@kpmg-postgres:5432/kpmg_teste` |
| `MONGO_URL` | VPS (backend) | `mongodb://user:pass@kpmg-mongo:27017/kpmg_logs?authSource=admin` |
| `RESEND_API_KEY` | VPS (backend) | — |
| `NOTIFICATION_EMAILS` | VPS (backend) | `email1@x.com,email2@x.com` |
| `CORS_ORIGIN` | VPS (backend) | URL do deploy Vercel |
| `PORT` | VPS (backend) | `3000` |
| `VITE_API_URL` | Vercel (frontend, build-time) | `https://kpmg.devarthur.com.br` |

Template real fica em `.env.example` na raiz de cada app — nunca
commitar `.env` com valores reais.

## Backup

Sem rotina de backup dedicada para este banco — decisão consciente,
dado que é dado reprodutível via seed (`prisma/seed.ts`), sem valor de
negócio real após a avaliação. Documentado aqui para deixar claro que
não é uma lacuna esquecida.

## Health check

`GET /health` no backend — usado tanto para verificação manual quanto
para possível monitoramento futuro via Uptime Kuma (já em uso na VPS
para outros serviços do autor).

## Checklist de deploy (para o agente que for executar)

- [ ] Criar `kpmg_teste` database na instância Postgres existente da VPS.
- [ ] Configurar rota Cloudflare Tunnel + Caddy para `kpmg.devarthur.com.br`.
- [ ] Criar secrets no GitHub Actions (SSH key, `RESEND_API_KEY`, etc.).
- [ ] Configurar variáveis de ambiente de build na Vercel.
- [ ] Validar CORS entre os dois domínios após primeiro deploy.
- [ ] Rodar seed em produção para o avaliador não ver lista vazia.
