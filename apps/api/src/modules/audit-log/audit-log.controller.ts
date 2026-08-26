import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ErrorResponseDto } from '../../common/dto/error-response.dto';

import { AuditLogService } from './audit-log.service';
import { AuditLogListResponseDto } from './dto/audit-log-response.dto';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto';

@ApiTags('audit-logs')
@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @ApiOperation({
    summary: 'Lista a trilha de auditoria',
    description:
      'Eventos de escrita do CRUD, gravados no MongoDB (ver docs/09-DECISIONS.md). Ordenados do mais recente para o mais antigo.',
  })
  @ApiOkResponse({
    description: 'Página de eventos',
    type: AuditLogListResponseDto,
  })
  @ApiServiceUnavailableResponse({
    description: 'MongoDB indisponível — a trilha não pode ser consultada',
    type: ErrorResponseDto,
  })
  findAll(@Query() query: ListAuditLogsQueryDto) {
    return this.auditLogService.findAll(query);
  }
}
