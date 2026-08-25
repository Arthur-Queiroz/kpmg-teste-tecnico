# Arquitetura

## Visão geral

```
┌─────────────────────┐          ┌───────────────────────────────┐
│   Frontend (React)  │          │      VPS Hostinger (KVM2)      │
│   deploy: Vercel     │  HTTPS   │                                 │
│                      │ ───────► │  ┌───────────────────────────┐ │
│  - CompanyListPage   │          │  │  Backend (NestJS, Docker)  │ │
│  - CompanyFormPage   │          │  │  kpmg.devarthur.com.br     │ │
│  - useCepLookup      │          │  │  (via Caddy + CF Tunnel)   │ │
│                      │          │  └──────────┬──────────────┘ │
│  chamada direta ──┐  │          │             │                 │
└────────────────────┼──┘          │             ▼                 │
                     │             │  ┌───────────────────────────┐ │
                     │             │  │  Postgres (instância       │ │
                     │             │  │  compartilhada, DB próprio)│ │
                     │             │  └───────────────────────────┘ │
                     ▼             └───────────────┬─────────────────┘
            ┌──────────────┐                       │
            │  ViaCEP API   │                       ▼
            │  (autofill)   │              ┌──────────────────┐
            └──────────────┘              │   Resend (e-mail)  │
                                            └──────────────────┘
```

## Fluxos principais

### Cadastro de empresa (fluxo feliz)

1. Usuário preenche o formulário no frontend. Ao digitar o CEP, o
   frontend chama a **ViaCEP diretamente** (sem passar pelo backend) e
   autopreenche os campos de endereço — feature isolada, com fallback
   manual (ver `05-FRONTEND-SPEC.md`).
2. Frontend valida o payload com `CompanySchema` (Zod, de
   `packages/shared`) antes de enviar — feedback instantâneo de erro.
3. Frontend envia `POST /companies` para a API na VPS.
4. Backend revalida o payload com o **mesmo** `CompanySchema` (nunca
   confia em validação client-side).
5. Backend persiste no Postgres via Prisma.
6. Backend dispara e-mail de notificação via `EmailService` (Resend),
   de forma assíncrona — a resposta HTTP não espera a confirmação de
   entrega do e-mail (evita que uma falha de e-mail derrube o cadastro).
7. Backend responde `201` com a empresa criada.
8. Frontend exibe toast de sucesso.

### Falha de e-mail não bloqueia o cadastro

Decisão de arquitetura: o envio de e-mail é **best-effort**. Se o
Resend falhar (timeout, erro de API), a empresa já foi persistida com
sucesso — o erro de e-mail é logado no backend, não propagado como erro
HTTP 500 para o usuário. Isso é coberto explicitamente nos testes
(`07-TESTING-STRATEGY.md`).

## Por que o ViaCEP não passa pelo backend

É uma decisão deliberada de simplicidade: a chamada é síncrona,
read-only, sem necessidade de guardar segredo (API pública, sem key), e
usada só para UX (autopreenchimento). Fazer o backend agir como proxy
adicionaria latência e complexidade sem ganho real de segurança ou
funcionalidade.

## Comunicação entre camadas — resumo

| De | Para | Protocolo | Autenticado? |
|---|---|---|---|
| Frontend (Vercel) | Backend (VPS) | HTTPS/REST | Não (por requisito do PDF) |
| Frontend (Vercel) | ViaCEP | HTTPS/REST | Não (API pública) |
| Backend (VPS) | Postgres (VPS) | TCP interno | Sim (credenciais de conexão) |
| Backend (VPS) | Resend | HTTPS/REST | Sim (API key) |
