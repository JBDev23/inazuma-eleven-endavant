import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  const corsOrigins = process.env.CORS_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors(
    corsOrigins?.length
      ? { origin: corsOrigins, credentials: true }
      : undefined,
  );

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, 
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  const port = Number(process.env.PORT) || 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`API listening on 0.0.0.0:${port}`);
}
bootstrap();
