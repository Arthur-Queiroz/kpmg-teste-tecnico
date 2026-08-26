# Frontend Spec

Stack: React + Vite + TypeScript + Tailwind (tokens em `design.md`) +
React Router + React Hook Form + Zod (via `packages/shared`).

## Rotas

| Rota | Página | Descrição |
|---|---|---|
| `/` | `CompanyListPage` | Listagem de empresas |
| `/companies/new` | `CompanyFormPage` (modo create) | Cadastro |
| `/companies/:id/edit` | `CompanyFormPage` (modo edit) | Edição |

## `CompanyListPage`

- ~~Hero azul (`--color-primary`) com título "Empresas" + CTA pill
  branco~~ — **superado**: o protótipo do Claude Design, feito depois
  deste rascunho, chegou a um cabeçalho de página sobre fundo claro com
  CTA azul, e foi ele que prevaleceu na implementação (o porquê está em
  `09-DECISIONS.md`). O CTA "Nova Empresa" navega para `/companies/new`.
- Tabela/cards com acento lateral (`--color-accent`), colunas:
  `Nome | CNPJ | Nome Fantasia | Cidade | Criado em | Alterado em | Ações`.
  (`Cidade` vem de `company.address.city`, achatada só aqui por
  legibilidade — o restante do endereço só aparece no formulário.)
- Ações por linha: editar, excluir (excluir abre modal de confirmação).
- Paginação (`?page=`).
- Empty state, com duas variantes conforme o contexto:
  - Lista realmente vazia (nenhuma empresa cadastrada): título
    "Nenhuma empresa cadastrada", texto "Comece cadastrando sua
    primeira empresa.", com CTA.
  - Busca/filtro sem resultado (existem empresas, mas nenhuma bate com
    o filtro aplicado): título "Nenhum resultado para os filtros
    aplicados", texto "Ajuste a busca ou a UF selecionada.", sem CTA de
    cadastro (o problema é o filtro, não a ausência de dados).

## `CompanyFormPage`

Dois blocos visuais separados (reforça a modelagem em dois objetos):

1. **Dados da Empresa** — Nome, CNPJ, Nome Fantasia.
2. **Endereço** — CEP (com autofill), Logradouro, Número, Complemento,
   Bairro, Cidade, Estado.

Validação: React Hook Form + resolver Zod usando `CompanySchema` de
`packages/shared` — **mesma** função de validação do backend, importada,
não reimplementada.

Ao submeter com sucesso: toast de sucesso + redirecionamento para `/`.
Ao falhar (400 da API): exibe mensagem de erro específica do campo
retornado pela API.

## Hook `useCepLookup`

Isolado, testável, reutilizável. Contrato:

```ts
function useCepLookup(cep: string): {
  status: "idle" | "loading" | "success" | "not_found" | "network_error";
  data: Partial<Address> | null;
};
```

Comportamento:
- Dispara busca só com CEP completo (8 dígitos), debounce de ~500ms.
- Todos os campos de endereço permanecem **editáveis** mesmo após
  autofill — nunca trava input.
- `not_found` e `network_error` degradam silenciosamente para
  preenchimento manual — nunca bloqueiam o cadastro.
- Usa `AbortController` (ou comparação de CEP na resposta) para evitar
  race condition entre requisições.

## Estados de UI a cobrir

- Loading (skeleton ou spinner) durante fetch de listagem.
- Erro de rede ao carregar listagem (retry manual).
- Erro de validação por campo (borda + mensagem, tokens de `design.md`).
- Toast de sucesso/erro para create, update, delete.
- Modal de confirmação de exclusão.

## Fora de escopo do frontend

- Autenticação, tela de login, menu de usuário (ver `CONSTRAINTS.md`).
- Testes automatizados de frontend (não exigidos pelo PDF).
