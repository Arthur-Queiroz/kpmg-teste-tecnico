# API Spec

## Base

- Produção: `https://kpmg.devarthur.com.br`
- Documentação interativa (Swagger UI): `/docs`
- Todos os endpoints são **públicos**, sem autenticação (ver `CONSTRAINTS.md`).
- Content-Type: `application/json`.

## DTOs

Gerados via `createZodDto()` (`nestjs-zod`), a partir dos schemas de
`packages/shared`. Uma única fonte de verdade alimenta validação e
Swagger simultaneamente (`patchNestJsSwagger()`).

- `CreateCompanyDto` — usa `CompanySchema` inteiro.
- `UpdateCompanyDto` — usa `CompanySchema.partial()` (todos os campos opcionais).

## Endpoints

### `POST /companies`
Cria uma nova empresa. Dispara e-mail de notificação de forma
assíncrona após persistência bem-sucedida (ver `06-EMAIL-NOTIFICATIONS.md`).

- Body: `CreateCompanyDto`
- 201: `Company` criada
- 400: erro de validação (Zod) — CNPJ inválido, campo obrigatório ausente
- 409: CNPJ já cadastrado

### `GET /companies`
Lista empresas cadastradas.

- Query opcional: `?page=1&pageSize=10&search=aurora&state=SP`
  - `search` — filtra por nome, nome fantasia ou CNPJ (com ou sem máscara).
  - `state` — filtra pela UF do endereço (`address.state`).
  - Filtros combinam entre si e valem sobre o conjunto inteiro, não sobre a
    página corrente (por isso são do servidor, não do frontend — ver
    `09-DECISIONS.md`).
- 200: `{ data: Company[], total: number, page: number, pageSize: number }`
  (`total` reflete os filtros aplicados)

### `GET /companies/:id`
Busca uma empresa por id.

- 200: `Company`
- 404: não encontrada

### `PATCH /companies/:id`
Atualiza uma empresa existente. **Não** dispara e-mail (notificação é
só no cadastro, conforme PDF).

- Body: `UpdateCompanyDto`
- 200: `Company` atualizada
- 404: não encontrada
- 400: erro de validação

### `DELETE /companies/:id`
Remove uma empresa.

- 204: sem conteúdo
- 404: não encontrada

### `GET /health`
Health check simples, sem lógica de negócio — usado para monitoramento
(Uptime Kuma) e verificação manual pós-deploy.

- 200: `{ status: "ok", timestamp: string }`

### `GET /audit-logs`
Lista a trilha de auditoria das operações de escrita em empresas
(`created`, `updated`, `deleted`), persistida no **MongoDB** (ver
`09-DECISIONS.md` — persistência poliglota). A escrita do log é
best-effort: uma falha do MongoDB nunca afeta o CRUD.

- Query opcional: `?page=1&pageSize=10&action=created`
- 200: `{ data: AuditLog[], total: number, page: number, pageSize: number }`

```json
{
  "action": "created",
  "companyId": "b3f1c2d4-0000-4000-8000-000000000001",
  "companyName": "Aurora Tecnologia Ltda",
  "cnpj": "12345678000195",
  "details": { "tradeName": "Aurora Tech" },
  "createdAt": "2026-08-26T12:00:00.000Z"
}
```

## Formato de erro padrão

Todo erro passa por um `HttpExceptionFilter` global, garantindo formato
consistente:

```json
{
  "statusCode": 400,
  "message": "CNPJ inválido",
  "error": "Bad Request",
  "path": "/companies",
  "timestamp": "2026-08-24T12:00:00.000Z"
}
```

## CORS

Liberado apenas para a origem do frontend em produção
(`CORS_ORIGIN` via env var — ver `08-DEPLOYMENT.md`), e para
`localhost` em desenvolvimento.
