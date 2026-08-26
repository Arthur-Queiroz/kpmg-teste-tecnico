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

## Busca e filtro de UF no servidor, não no cliente

O protótipo do Claude Design tem busca por texto e filtro de UF, mas a
primeira versão da API só previa `page`/`pageSize`. Filtrar no frontend
significaria filtrar apenas a página já carregada — com paginação, o
usuário veria "nenhum resultado" mesmo existindo empresas que batem com
o filtro na página seguinte. Por isso `GET /companies` ganhou `search` e
`state` (ver `03-API-SPEC.md`), e o frontend só repassa os parâmetros.
Os filtros vivem na URL (`?search=&state=&page=`), o que torna a
listagem filtrada compartilhável e recarregável.

## Mock da API no frontend atrás de `VITE_API_MOCK`

As telas foram implementadas antes dos endpoints existirem. Em vez de
deixar o frontend inutilizável nesse intervalo, `apps/web/src/api`
define a interface `CompanyApi` com duas implementações: a real
(`httpCompanyApi`) e uma em memória (`mockCompanyApi`, ligada por
`VITE_API_MOCK=true`). As páginas dependem só da interface — quando a
API real subir, nada muda nelas e o mock some do caminho. O mock
reproduz inclusive 409 de CNPJ duplicado e 404, para que os fluxos de
erro sejam exercitáveis.

## `packages/shared` consumido do fonte no frontend

O `dist/` do pacote compartilhado é CommonJS, formato que o NestJS
precisa mas que o Vite não importa como ESM em dev (named exports
quebram). Em vez de gerar um segundo build só para o browser, o
`vite.config.ts` aponta um alias de `@kpmg/shared` para
`packages/shared/src` (com o mesmo `paths` no `tsconfig.app.json`). O
backend segue consumindo o `dist/`, e o frontend deixa de depender de
buildar o pacote antes de rodar.

## Listagem sem hero azul (protótipo prevalece sobre o rascunho visual)

`design.md` e `05-FRONTEND-SPEC.md` descreviam a listagem com um "hero
azul e CTA pill branco". O protótipo do Claude Design, feito depois,
chegou num cabeçalho de página sobre fundo claro com CTA azul — mais
legível e mais próximo de um admin real, sem desperdiçar altura de tela
com um bloco decorativo. A implementação segue o protótipo; o azul da
marca fica no header fixo e nos acentos da tabela.

## ViaCEP chamado direto do frontend

Autopreenchimento de endereço é uma melhoria de UX isolada e opcional,
com fallback manual robusto para CEP não encontrado ou API fora do ar
— nunca bloqueia o cadastro. Chamado direto do browser (sem proxy pelo
backend) por ser uma API pública, sem necessidade de segredo, e para
não adicionar latência desnecessária ao fluxo.

## Prisma 6 fixado (não 7)

O Prisma 7 remove o generator `prisma-client-js` que
`docs/02-DATA-MODEL.md` documenta e passa a exigir `prisma.config.ts` +
driver adapters (cliente sem engine Rust). Fixado em `prisma@6` /
`@prisma/client@6` para manter o setup documentado e a integração
CommonJS direta com o NestJS, sem configuração extra.

## nestjs-zod 5: `cleanupOpenApiDoc` no lugar de `patchNestJsSwagger`

O nestjs-zod 5 removeu `patchNestJsSwagger()`: os DTOs criados com
`createZodDto()` já carregam os metadados de schema que o
`SwaggerModule.createDocument()` consome nativamente. Resta apenas
`cleanupOpenApiDoc(document)` antes do `SwaggerModule.setup()` para
limpar artefatos internos do documento OpenAPI.

## Postgres local na porta 5433 do host

A 5432 do host já era ocupada por outro container Docker da máquina de
desenvolvimento (projeto `fut-app`), o que causava falha de autenticação
ao conectar (a requisição caía no banco errado). O `docker-compose.yml`
deste projeto publica `5433:5432`; em produção o backend conecta no
container `kpmg-postgres` pela rede Docker interna `net-kpmg` (ver a
decisão seguinte), sem porta de host envolvida.

## Postgres dedicado por app na VPS (não instância compartilhada)

O planejamento (`08-DEPLOYMENT.md`, versão inicial) previa criar o
database `kpmg_teste` na instância Postgres compartilhada da VPS. Na
implementação, o deploy seguiu o modelo vps-infra (o mesmo dos apps
migrados, ex.: chatjpt): cada app declara seu próprio Postgres
`stateful` no manifesto — container `kpmg-postgres` na rede interna
`net-kpmg`, com volume em `/var/lib/vps-apps/kpmg/pgdata`. Motivos:

- o modelo vps-infra confina cada app à sua rede (`net-<app>` + `edge`);
  conectar no Postgres compartilhado (rede `data`) furaria esse
  isolamento;
- ciclo de vida independente: upgrade, volume e credenciais do banco
  pertencem ao app, sem risco de afetar outros projetos da VPS;
- o banco é descartável por natureza (reprodutível via seed), então a
  consolidação não trazia benefício real aqui.

A porta 5433 do compose local segue valendo só para desenvolvimento.

## Migrations como job `migrate` no release (não entrypoint)

Em vez de rodar `prisma migrate deploy` no entrypoint do container, o
manifesto declara um serviço `kind: job` (`migrate`) que roda com a
mesma imagem do release antes do swap do serviço `api` (`runBefore`).
Uma migration que falha aborta o release com produção intacta — no
modelo entrypoint, o container novo subiria quebrado até o healthcheck
derrubá-lo.

## Persistência poliglota: MongoDB para log de auditoria

O projeto usa dois bancos, cada um no que faz melhor — decisão deliberada
para demonstrar o raciocínio de "quando usar NoSQL":

- **Postgres (relacional)** para o domínio: empresas são dados
  estruturados, com integridade (CNPJ único), schema estável e consultas
  com filtros combinados (`search` + `state` + paginação). Território
  natural de SQL.
- **MongoDB (documentos)** para o log de auditoria: eventos de
  `created`/`updated`/`deleted` são **append-only, alto volume e de
  esquema variável** (o payload de um update carrega os campos
  alterados; o de um create, a empresa inteira). Não há JOIN nem
  integridade referencial envolvida, e a escrita precisa ser barata e
  nunca acoplada à transação do domínio. Forçar isso em SQL significaria
  ou uma tabela com colunas genéricas/`JSONB` mal aproveitada, ou schema
  rígido que muda a cada novo tipo de evento.

Garantias arquiteturais mantidas:

- a escrita do log é **best-effort** (como o e-mail): falha do MongoDB é
  logada, nunca derruba o CRUD — o dado importante continua no Postgres;
- o MongoDB nunca é fonte de verdade de negócio — é uma trilha
  reconstruível e dispensável;
- exposto para avaliação via `GET /audit-logs` (público, paginado, como
  o resto da API — ver `CONSTRAINTS.md`).
