import { Module } from '@nestjs/common';

import { EmailModule } from '../../email/email.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';

@Module({
  imports: [EmailModule, AuditLogModule],
  controllers: [CompanyController],
  providers: [CompanyService],
})
export class CompanyModule {}
