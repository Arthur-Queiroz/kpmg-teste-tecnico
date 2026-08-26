import { createZodDto } from 'nestjs-zod';

import { CompanySchema } from '@kpmg/shared';

export class UpdateCompanyDto extends createZodDto(CompanySchema.partial()) {}
