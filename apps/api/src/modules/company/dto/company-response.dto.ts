import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { CompanyRecordSchema } from '@kpmg/shared';

/**
 * Contratos de resposta do CRUD de empresas. Derivam do mesmo
 * `CompanyRecordSchema` que o frontend consome, então o Swagger nunca
 * descreve um formato diferente do que a API devolve de fato.
 */
export class CompanyResponseDto extends createZodDto(CompanyRecordSchema) {}

export const CompanyListResponseSchema = z.object({
  data: z.array(CompanyRecordSchema).describe('Empresas da página atual'),
  total: z.number().int().describe('Total de empresas após os filtros'),
  page: z.number().int().describe('Página atual (1-based)'),
  pageSize: z.number().int().describe('Itens por página'),
});

export class CompanyListResponseDto extends createZodDto(
  CompanyListResponseSchema,
) {}
