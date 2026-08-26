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

7. **Smoke test pós-deploy** contra `kpmg.devarthur.com.br`: `/health`,
   `/companies` e `/audit-logs`. O release já espera o healthcheck do
   container, mas o smoke prova o caminho externo inteiro — Cloudflare
   Tunnel, Caddy, Postgres e Mongo. O `/audit-logs` é o sinal mais
   informativo: sem MongoDB conectado o `AuditLogService` devolve 503,
   então 200 ali é prova de que a trilha está de pé em produção.

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

## Runbook: mudar configuração em produção

Em produção **não existe arquivo `.env`**. O container recebe as
variáveis de duas fontes distintas, e saber qual é qual evita editar o
lugar errado:

| Tipo | Onde vive | Exemplos |
|---|---|---|
| Não sensível | `env:` inline no manifesto `apps/kpmg.yaml` | `NOTIFICATION_EMAILS`, `CORS_ORIGIN`, `PORT` |
| Sensível | `/var/lib/vps-apps/kpmg/secrets.env` na VPS | `DATABASE_URL`, `MONGO_URL`, `RESEND_API_KEY`, senhas |

No manifesto, um segredo aparece como `fromSecret`. O `deployctl`
resolve pelo **`name` da variável**, não pelo slug do `fromSecret`: uma
entrada `name: MONGO_URL` + `fromSecret: mongo-url` procura a chave
`MONGO_URL` no `secrets.env`. Se a chave faltar, o release **aborta com
erro** — produção fica intacta, não sobe quebrada.

### Armadilha: o manifesto existe em dois lugares

`/etc/vps-infra` **não é um clone git**. O manifesto vive no repositório
`vps-infra` (registro e histórico) e em `/etc/vps-infra/apps/kpmg.yaml`
na VPS (o que o `deployctl` de fato lê). **Editar só o GitHub não muda
nada em produção.** Atualize os dois; em caso de divergência, quem manda
é o da VPS.

### Passo a passo

```bash
ssh hostinger
sudo nano /etc/vps-infra/apps/kpmg.yaml     # ou o secrets.env, se for segredo
sudo deployctl validate kpmg                # valida antes de aplicar
sudo deployctl status kpmg                  # copiar o currentDigest
sudo deployctl release kpmg api sha256:<digest-atual>
```

Releasear com o **mesmo digest** é o ponto central: não rebuilda imagem
nenhuma, apenas recria o container com o ambiente novo, passando pelo
healthcheck e pelo swap. Zero downtime.

Conferir depois:

```bash
sudo docker exec kpmg-api node -e "console.log(process.env.NOTIFICATION_EMAILS)"
```

### Reiniciar não aplica configuração

`docker restart kpmg-api` **mantém as variáveis antigas** — o Docker
congela o ambiente no momento em que o container é *criado*. Para pegar
env nova é preciso **recriar**, que é exatamente o que o `release` faz.
Vale igual para segredos: trocar a `RESEND_API_KEY` no `secrets.env` só
surte efeito depois de um `release`.

### Conferir se produção está no commit certo

O deploy não copia código: publica uma imagem imutável e manda a VPS
rodar aquele digest. Então "código desatualizado" se resume a comparar
dois valores — o digest publicado pelo run do commit e o
`currentDigest` do `deployctl status`.

Isso não é teórico: durante um incidente do GitHub Actions, dois runs
saíram da fila fora de ordem e o commit **mais antigo** terminou depois,
sobrescrevendo o mais novo. Os dois runs reportaram sucesso — cada um
fez o seu trabalho corretamente — e só a comparação de digests revelou
a inversão. A correção é releasear o digest do commit certo, que já
está no GHCR e já passou pela suíte:

```bash
sudo deployctl release kpmg api sha256:<digest-do-commit-mais-novo>
```

### Rollback

```bash
sudo deployctl status kpmg      # a lista de revisions traz os digests anteriores
sudo deployctl rollback kpmg api
```

## Observabilidade: onde ficam os logs

| O quê | Onde | Como ver |
|---|---|---|
| API (NestJS) | container `kpmg-api` na VPS | `sudo docker logs kpmg-api` |
| Postgres | container `kpmg-postgres` | `sudo docker logs kpmg-postgres` |
| MongoDB | container `kpmg-mongo` | `sudo docker logs kpmg-mongo` |
| Proxy de borda | container `caddy` | `sudo docker logs caddy` |
| Pipeline | GitHub Actions | aba Actions do repositório |
| Build/deploy do frontend | Vercel | dashboard do projeto |
| Entrega de e-mail | Resend | painel do Resend (status por mensagem) |

### Comandos do dia a dia

```bash
ssh hostinger
sudo docker logs kpmg-api --tail 50          # últimas 50 linhas
sudo docker logs kpmg-api -f                 # acompanhar em tempo real
sudo docker logs kpmg-api --since 15m        # últimos 15 minutos
sudo docker logs kpmg-api --timestamps       # com horário de cada linha
sudo docker logs kpmg-api 2>&1 | grep -i error
sudo deployctl status kpmg                   # o que está no ar e o histórico de revisões
```

O `sudo` é necessário: o usuário `agent` não pertence ao grupo docker.

### O que você encontra nesses logs

Boot da aplicação (módulos e rotas mapeadas), erros não tratados
capturados pelo `HttpExceptionFilter`, e os avisos explícitos do
domínio — falha no envio de e-mail e falha na gravação da trilha de
auditoria, ambos logados sem derrubar a requisição.

### Duas limitações, ditas de forma clara

1. **Não há log de requisições.** Nem o Caddy (sem diretiva `log`) nem o
   NestJS (sem interceptor) registram chamadas individuais. Verificado:
   um `GET /health` real não aparece em nenhum dos dois. Para auditar
   *o que foi alterado* existe a trilha em `GET /audit-logs`, que cobre
   as operações de escrita do CRUD — mas não substitui um access log.
2. **Os logs zeram a cada deploy.** Cada release cria um container novo
   e remove o antigo, então `docker logs kpmg-api` mostra apenas desde a
   última publicação. A retenção é a padrão do driver `json-file` com
   rotação (`max-size=10m`, `max-file=3`), ou seja, no máximo 30 MB por
   container — e nada é enviado para fora da VPS.

Para um teste técnico isso é suficiente e é uma escolha consciente:
centralização de logs (Loki, ELK) e access log estruturado seriam o
próximo passo natural num sistema com tráfego real.

## Backup

Sem rotina de backup dedicada para este banco — decisão consciente,
dado que é dado reprodutível via seed (`prisma/seed.js`), sem valor de
negócio real após a avaliação. Documentado aqui para deixar claro que
não é uma lacuna esquecida.

## Health check

`GET /health` no backend — usado tanto para verificação manual quanto
para possível monitoramento futuro via Uptime Kuma (já em uso na VPS
para outros serviços do autor).

## Checklist de deploy — concluído

- [x] Banco `kpmg_teste` criado (container `kpmg-postgres`, rede `net-kpmg`).
- [x] Rota Cloudflare Tunnel + Caddy para `kpmg.devarthur.com.br`.
- [x] Secrets no GitHub Actions (`DEPLOY_SSH_KEY`, `VPS_HOST`) e no
      `secrets.env` da VPS (`DATABASE_URL`, `MONGO_URL`, `RESEND_API_KEY`,
      senhas dos bancos).
- [x] Variáveis de build na Vercel (`VITE_API_URL`).
- [x] CORS validado entre os dois domínios (`CORS_ORIGIN` no manifesto).
- [x] Seed de produção aplicado.
- [x] MongoDB stateful (`kpmg-mongo`) para a trilha de auditoria.
- [x] Smoke test pós-deploy no pipeline (`/health`, `/companies`, `/audit-logs`).
