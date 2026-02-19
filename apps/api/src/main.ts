import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());

  // CORS
  const corsOrigins = configService
    .get<string>('CORS_ORIGINS', 'http://localhost:3001')
    .split(',')
    .map((origin) => origin.trim());

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api', {
    exclude: ['/health'],
  });

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`Application running on http://localhost:${port}`);
  logger.log(`Environment: ${configService.get<string>('NODE_ENV')}`);
}
void bootstrap();
