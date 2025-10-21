import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as express from 'express';
import { join } from 'path';
import cookieParser from 'cookie-parser';

// App bootstrap entry. Sets security headers, validation rules,
// static file serving for uploads, API docs, and starts the server.

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  if (!process.env.JWT_SECRET) {
    // Fail fast if JWT secret is missing in non-test environments
    // eslint-disable-next-line no-console
    console.error('[config] JWT_SECRET is required');
    process.exit(1);
  }
  // Add common security HTTP headers
  app.use(helmet());
  app.use(cookieParser());
  // Allow frontend origins only in development via ALLOWED_ORIGINS env (comma-separated)
  if (process.env.NODE_ENV !== 'production') {
    const allowed = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',').map((s) => s.trim());
    app.enableCors({ origin: allowed, credentials: true });
  }
  // Validate all incoming requests and strip unknown fields
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));

  // Serve uploaded assets
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Firma Ziyaretçi Kayıt API')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();
    const doc = SwaggerModule.createDocument(app, config);
    // Expose Swagger UI at /docs for easy API exploration (dev only)
    SwaggerModule.setup('docs', app, doc);
  }

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
}

bootstrap();
