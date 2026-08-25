# Requisitos

Transcrito e organizado a partir do PDF oficial do teste técnico. Nenhum
requisito abaixo foi inventado — extensões e diferenciais estão
claramente marcados como tal.

## Requisitos Funcionais (do PDF)

1. **Cadastro de Empresas** — campos: Nome, CNPJ, Nome Fantasia,
   Endereço, Data de Criação (`CriadoEm`), Data de Alteração (`AlteradoEm`).
2. **CRUD completo** — Criar, Ler, Atualizar, Excluir.
3. **Tela de Listagem** — exibe empresas cadastradas, com botão para
   cadastrar nova empresa.
4. **Notificação por e-mail** — ao cadastrar uma nova empresa, enviar
   e-mail automaticamente para um grupo de e-mails pré-configurado.

## Requisitos Técnicos (do PDF)

- **Frontend**: React. Tela de listagem interativa. Botão "Cadastrar
  Nova Empresa" redireciona para tela de cadastro.
- **Backend**: NestJS, API RESTful, responsável por persistir dados e
  disparar notificações de e-mail.
- **Banco de dados**: relacional (PostgreSQL/MySQL) ou NoSQL (MongoDB)
  — **decisão do projeto: PostgreSQL + Prisma ORM**.
- **Testes automatizados**: obrigatórios no backend, cobrindo cadastro,
  edição, exclusão, listagem e validação do envio de e-mail. **Não
  exigidos no frontend.**

## Requisitos Adicionais (do PDF)

- **Sem autenticação** — aplicação acessível diretamente, sem login.
  Ver `CONSTRAINTS.md` para o detalhamento dessa restrição.
- **Simples e funcional** — interface objetiva, focada em cadastro e
  listagem.

## Entrega Final (do PDF)

1. Solução funcionando, com CRUD e e-mail operacionais.
2. Código-fonte disponível.
3. Documentação explicando: comunicação entre as partes do sistema,
   decisões técnicas tomadas, e como o sistema atende aos requisitos de
   CRUD e notificação — coberto por `04-ARCHITECTURE.md` e `09-DECISIONS.md`.

## Requisitos Não-Funcionais (decisão do projeto, não do PDF)

- Nomenclatura e organização de código seguindo `10-CONVENTIONS.md`.
- API documentada via Swagger/OpenAPI, gerado a partir dos schemas Zod.
- CI executando testes a cada push (ver `08-DEPLOYMENT.md`).
- Identidade visual consistente com a marca KPMG (ver `design.md`).
