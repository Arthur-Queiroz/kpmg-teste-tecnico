import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** Query params of GET /audit-logs — see docs/03-API-SPEC.md. */
export const ListAuditLogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  action: z.enum(['created', 'updated', 'deleted']).optional(),
});

export class ListAuditLogsQueryDto extends createZodDto(
  ListAuditLogsQuerySchema,
) {}
