import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** Uma issue do Zod, repassada pelo nestjs-zod em erros de validação. */
const ValidationIssueSchema = z.object({
  code: z.string().optional().describe('Código da issue do Zod'),
  path: z
    .array(z.union([z.string(), z.number()]))
    .optional()
    .describe('Caminho do campo, ex.: ["address","city"]'),
  message: z.string().optional().describe('Mensagem do campo'),
});

/**
 * Formato único de erro da API, produzido pelo HttpExceptionFilter global
 * (ver docs/03-API-SPEC.md). `errors` só aparece em falhas de validação.
 */
export const ErrorResponseSchema = z.object({
  statusCode: z.number().int().describe('Status HTTP'),
  message: z.string().describe('Mensagem legível do erro'),
  error: z.string().describe('Nome do status HTTP, ex.: "Bad Request"'),
  errors: z
    .array(ValidationIssueSchema)
    .optional()
    .describe('Issues de validação, quando houver'),
  path: z.string().describe('Caminho da requisição'),
  timestamp: z.string().describe('Momento do erro (ISO 8601)'),
});

export class ErrorResponseDto extends createZodDto(ErrorResponseSchema) {}
