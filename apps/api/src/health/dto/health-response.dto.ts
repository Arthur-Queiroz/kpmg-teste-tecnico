import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const HealthResponseSchema = z.object({
  status: z.literal('ok').describe('Sempre "ok" quando a API responde'),
  timestamp: z.string().describe('Momento da verificação (ISO 8601)'),
});

export class HealthResponseDto extends createZodDto(HealthResponseSchema) {}
