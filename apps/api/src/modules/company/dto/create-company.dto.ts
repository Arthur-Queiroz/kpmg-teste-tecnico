import { createZodDto } from 'nestjs-zod';

import { CompanySchema } from '@kpmg/shared';

export class CreateCompanyDto extends createZodDto(CompanySchema) {}
