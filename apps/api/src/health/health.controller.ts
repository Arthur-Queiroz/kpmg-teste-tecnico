import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { HealthResponseDto } from './dto/health-response.dto';

/** Liveness probe for monitoring and post-deploy checks (docs/03-API-SPEC.md). */
@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({
    summary: 'Verifica se a API está de pé',
    description:
      'Sem lógica de negócio: usado pelo healthcheck do container e pelo smoke test pós-deploy.',
  })
  @ApiOkResponse({ description: 'API respondendo', type: HealthResponseDto })
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
