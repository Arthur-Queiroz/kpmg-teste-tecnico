import { Controller, Get, Query } from '@nestjs/common';

import { AuditLogService } from './audit-log.service';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto';

@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  findAll(@Query() query: ListAuditLogsQueryDto) {
    return this.auditLogService.findAll(query);
  }
}
