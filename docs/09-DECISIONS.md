# Decisões Técnicas

Registro das decisões tomadas durante o planejamento, com o raciocínio
por trás de cada uma — serve tanto de guia de implementação quanto de
resposta direta ao item "documentação detalhada" exigido na entrega
final do PDF.

## Monorepo (pnpm workspaces)

`apps/api`, `apps/web`, `packages/shared`. Permite compartilhar
validação (Zod) entre frontend e backend sem duplicar regra de negócio
— a mesma função de validação de CNPJ, por exemplo, roda nos dois
lugares porque é importada do mesmo pacote, não reescrita.

## Endereço como objeto (não entidade separada, não colunas flat)

`Address` é um schema Zod aninhado, persistido como `Json` no Postgres.
Alternativas consideradas:
- Colunas flat na tabela `Company`: mais simples, mas não demonstra
  intenção de modelagem, e mistura dois conceitos numa tabela só.
- Entidade relacional separada (`Address` com FK): normalização mais
  "correta" tecnicamente, mas adiciona JOIN e migração extra para uma
  relação que é sempre estritamente 1:1 — complexidade sem ganho real
  neste escopo.
- **Escolhido: objeto Json.** Mantém o conceito de "Endereço" como uma
  unidade coesa (como o próprio PDF trata), com validação estruturada
  via Zod na borda da API, sem overhead de JOIN.

## Validação de CNPJ com dígito verificador real

A maioria das implementações se limita a checar 14 dígitos. Este
projeto implementa o algoritmo de módulo 11 completo (dois DVs), com
testes unitários cobrindo casos de borda (sequência repetida, DV
incorreto, máscara). Demonstra rigor além do mínimo exigido.

## Zod + `nestjs-zod` (não `class-validator`)

Escolhido para ter uma única fonte de verdade de validação,
compartilhável entre backend e frontend via `packages/shared`, e capaz
de alimentar o Swagger automaticamente (`patchNestJsSwagger()`), sem
duplicar a definição de schema em decorators.

## E-mail: Resend em produção, mock em testes

SMTP direto de uma VPS sem reputação de IP estabelecida tem risco real
de cair em spam. Resend oferece deliverability confiável com setup
mínimo. Testes nunca batem na API real — usam uma implementação fake
de `EmailService`, injetada via DI do NestJS.

## Falha de e-mail não bloqueia o cadastro

O envio é best-effort: se falhar, a empresa já foi persistida, e o erro
é logado, não propagado como falha HTTP. Prioriza a operação principal
(cadastro) sobre a secundária (notificação).

## Sem autenticação (restrição, não omissão)

Exigência explícita do PDF. Documentado separadamente em
`CONSTRAINTS.md` para evitar que um agente de IA adicione autenticação
"por reflexo", já que outros projetos do autor usam esse padrão.

## VPS própria em vez de Railway/Supabase para o banco

Infraestrutura que o autor já opera e monitora ativamente evita riscos
de cold start ou limite de conexão de free tier de serviços
gerenciados — relevante numa janela de avaliação onde o acesso pode
ocorrer a qualquer momento.

## Deploy em duas plataformas (Vercel + VPS)

Deliberado como diferencial: demonstra capacidade de operar tanto em
plataforma gerenciada (Vercel) quanto em infraestrutura própria
(Docker + Caddy + Cloudflare Tunnel na VPS), em vez de depender de um
único ecossistema.

## Nomenclatura: inglês, exceto CNPJ

Identificadores de código em inglês, por ser padrão internacional e
coerente com a documentação do NestJS. `CNPJ` mantido como está — é um
termo jurídico brasileiro específico, sem tradução fiel (`TaxId`
perderia precisão de domínio). Detalhamento completo em
`10-CONVENTIONS.md`.

## Colunas do banco em camelCase nativo

Sem `@map` para snake_case — Prisma usa os mesmos nomes de campo do
schema diretamente nas colunas, reduzindo uma camada de tradução mental
entre código e banco.

## ViaCEP chamado direto do frontend

Autopreenchimento de endereço é uma melhoria de UX isolada e opcional,
com fallback manual robusto para CEP não encontrado ou API fora do ar
— nunca bloqueia o cadastro. Chamado direto do browser (sem proxy pelo
backend) por ser uma API pública, sem necessidade de segredo, e para
não adicionar latência desnecessária ao fluxo.
