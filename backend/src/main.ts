import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as express from 'express';
import { join } from 'path';

// App bootstrap entry. Sets security headers, validation rules,
// static file serving for uploads, API docs, and starts the server.

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Add common security HTTP headers
  app.use(helmet());
  // Allow frontend on localhost:5173 to call this API during development
  app.enableCors({ origin: [/localhost:5173$/], credentials: true });
  // Validate all incoming requests and strip unknown fields
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  // Serve uploaded assets
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  const config = new DocumentBuilder()
    .setTitle('Firma Ziyaretçi Kayıt API')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const doc = SwaggerModule.createDocument(app, config);
  // Expose Swagger UI at /docs for easy API exploration
  SwaggerModule.setup('docs', app, doc);

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
}

bootstrap();
