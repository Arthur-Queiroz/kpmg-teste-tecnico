import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { BRAZILIAN_STATES } from '@kpmg/shared';

/**
 * Query params of GET /companies — see docs/03-API-SPEC.md. Filters are
 * applied server-side over the whole dataset, not over the current page.
 */
export const ListCompaniesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().min(1).max(150).optional(),
  state: z.enum(BRAZILIAN_STATES).optional(),
});

export class ListCompaniesQueryDto extends createZodDto(
  ListCompaniesQuerySchema,
) {}
