import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Only the configured frontend origin in production; localhost in dev —
  // see docs/03-API-SPEC.md. No credentials: the API is public by design
  // (docs/CONSTRAINTS.md).
  const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim());
  app.enableCors({ origin: corsOrigins });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Cadastro de Empresas')
    .setDescription(
      'API pública de cadastro de empresas — contrato em docs/03-API-SPEC.md',
    )
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, cleanupOpenApiDoc(document));

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
