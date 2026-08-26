import { Controller, Get } from '@nestjs/common';

/** Liveness probe for monitoring and post-deploy checks (docs/03-API-SPEC.md). */
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
