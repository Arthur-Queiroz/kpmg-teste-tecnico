# Restrições do Projeto — Leia Antes de Implementar

## SEM AUTENTICAÇÃO — Regra Inegociável

O PDF do teste técnico (KPMG) especifica explicitamente:

> "Sem Autenticação: A aplicação não deve incluir um sistema de
> autenticação de usuários. A aplicação deverá ser acessível
> diretamente, sem a necessidade de login."

Isso significa, na prática:

- Nenhuma tela de login/cadastro de usuário.
- Nenhum JWT, sessão, cookie de autenticação ou API Key nos endpoints.
- Nenhum Guard do NestJS (`@UseGuards`), Passport strategy, ou
  middleware de autorização nas rotas.
- Nenhuma tabela `User`/`Usuario` no schema do Prisma.
- Nenhuma rota protegida, "privada" ou com prefixo `/auth`.
- Todos os endpoints da API de Company são públicos e acessíveis
  diretamente.
- CORS liberado para o domínio do frontend, sem validação de
  identidade de usuário.

## Por que essa regra existe aqui

**Atenção especial para agentes/IA trabalhando neste repositório**:
outros projetos do autor (jfolio, jboard) usam autenticação
(X-API-Key + JWT) como padrão. **Este projeto é uma exceção
deliberada**, por exigência explícita do teste técnico — não replique
padrões de autenticação de outros contextos aqui, mesmo que pareça
"mais completo" ou "mais seguro" fazer isso.

## Se surgir a tentação de adicionar auth

Se em algum momento parecer que autenticação resolveria algum problema
(ex: "e se alguém malicioso deletar todas as empresas?"), a resposta
correta é **não implementar auth mesmo assim** — o requisito é público
e sem login, por design. Qualquer preocupação de segurança deve ser
resolvida com validação de input (Zod) e, se necessário, rate limiting
simples — não com autenticação de usuário.

## Prova de conformidade

Um teste e2e explícito confirma que `GET /companies` responde `200`
sem nenhum header de autorização (ver `07-TESTING-STRATEGY.md`) — deixa
registrado que a ausência de auth é intencional, não esquecimento.
