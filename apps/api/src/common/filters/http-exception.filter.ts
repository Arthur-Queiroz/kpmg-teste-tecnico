import { STATUS_CODES } from 'node:http';

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

/**
 * Global error shape — see docs/03-API-SPEC.md. Zod validation failures come
 * from nestjs-zod as `{ statusCode, message, errors }`; the `errors` array is
 * preserved so the frontend can map issues back to form fields.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (!(exception instanceof HttpException)) {
      this.logger.error(
        `Unhandled error on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const exceptionBody =
      exception instanceof HttpException ? exception.getResponse() : null;
    const payload =
      typeof exceptionBody === 'object' && exceptionBody !== null
        ? (exceptionBody as Record<string, unknown>)
        : { message: exceptionBody };

    response.status(statusCode).json({
      statusCode,
      message:
        payload.message ??
        (exception instanceof Error ? exception.message : 'Erro interno'),
      error: STATUS_CODES[statusCode] ?? 'Error',
      ...(payload.errors ? { errors: payload.errors } : {}),
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
