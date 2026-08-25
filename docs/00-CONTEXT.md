# Contexto

## Origem

Teste técnico para vaga de Desenvolvedor Full Stack, aplicado pela KPMG
Consultoria Ltda. (contato: Thaynara Teodoro, Talent Acquisition |
People Performance & Culture). Enunciado original: `Teste_Técnico_-_FullStack.pdf`.

## Objetivo do teste (conforme PDF)

Criar uma aplicação web utilizando **React** no Frontend e **NestJS** no
Backend, responsável pelo gerenciamento de empresas, com operações de
CRUD completas e notificação por e-mail no cadastro.

## Abordagem adotada

O candidato optou por conduzir o desenvolvimento com **Spec-Driven
Development (SDD)**: toda decisão técnica relevante é documentada em
`docs/` antes da implementação, servindo tanto de guia para os agentes
de IA que vão implementar o código quanto de material de entrega final
("documentação detalhada" exigida no PDF).

## Diferenciais em relação ao mínimo exigido

- Monorepo com pacote compartilhado de validação (Zod) entre front e back.
- Validação real de CNPJ (dígito verificador, não só formato).
- Endereço como objeto estruturado, com autopreenchimento via ViaCEP.
- Documentação OpenAPI/Swagger gerada a partir dos mesmos schemas Zod
  usados na validação (`nestjs-zod`).
- Testes automatizados no backend (unitários + e2e), com CI rodando a
  cada push.
- Deploy real em duas plataformas distintas: frontend na Vercel,
  backend em VPS própria — usada como prova de conhecimento de
  infraestrutura, não só de código.
- Identidade visual inspirada na marca KPMG (ver `design.md`).

## Fora de escopo (deliberadamente)

- Autenticação de usuários (exigência explícita do PDF — ver `CONSTRAINTS.md`).
- Multi-tenancy, dashboards, relatórios, gestão de usuários — não fazem
  parte do enunciado.
