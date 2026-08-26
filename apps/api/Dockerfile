# Dockerfile da API (contexto = raiz do monorepo).
# Usado pelo reusable workflow vps-deploy (ver .github/workflows/ci.yml).

FROM node:24-alpine AS builder
WORKDIR /app
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @kpmg/shared build \
  && pnpm --filter api exec prisma generate \
  && pnpm --filter api build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable

# Manifests de todos os pacotes do workspace: o pnpm precisa enxergar os
# importers do lockfile mesmo instalando só api + shared.
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/

RUN pnpm install --frozen-lockfile --prod --filter @kpmg/shared --filter api

COPY --from=builder /app/packages/shared/dist packages/shared/dist
COPY --from=builder /app/apps/api/dist apps/api/dist
COPY --from=builder /app/apps/api/prisma apps/api/prisma

# Gera o Prisma Client contra as dependências de produção (o postinstall do
# @prisma/client não roda sob o pnpm — ver docs/status/LESSONS-TESTS.md).
RUN pnpm --filter api exec prisma generate

USER node
EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]
