import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** Espelha `AuditLogRecord` (audit-log.types.ts) para o Swagger. */
const AuditLogRecordSchema = z.object({
  action: z
    .enum(['created', 'updated', 'deleted'])
    .describe('Operação que gerou o evento'),
  companyId: z.string().describe('Id da empresa afetada'),
  companyName: z.string().describe('Nome da empresa no momento do evento'),
  cnpj: z.string().describe('CNPJ, somente dígitos'),
  details: z
    .record(z.string(), z.unknown())
    .optional()
    .describe('Payload do evento (empresa criada, campos alterados, ...)'),
  createdAt: z.string().describe('Momento do evento (ISO 8601)'),
});

export const AuditLogListResponseSchema = z.object({
  data: z.array(AuditLogRecordSchema).describe('Eventos da página atual'),
  total: z.number().int().describe('Total de eventos após os filtros'),
  page: z.number().int().describe('Página atual (1-based)'),
  pageSize: z.number().int().describe('Itens por página'),
});

export class AuditLogListResponseDto extends createZodDto(
  AuditLogListResponseSchema,
) {}
