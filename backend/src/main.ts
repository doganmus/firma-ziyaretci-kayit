import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as express from 'express';
import { join } from 'path';
import cookieParser from 'cookie-parser';
import { validateEnvOrExit } from './config/env.validation';
import { WinstonModule } from 'nest-winston';
import { createWinstonConfig } from './common/logger.config';

// App bootstrap entry. Sets security headers, validation rules,
// static file serving for uploads, API docs, and starts the server.

async function bootstrap() {
  // Validate all environment variables before starting the app
  validateEnvOrExit();

  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(createWinstonConfig()),
  });
  
  // Add common security HTTP headers
  app.use(helmet());
  app.use(cookieParser());
  
  // CORS configuration for both development and production
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    // Production: Use FRONTEND_URL or ALLOWED_ORIGINS
    let allowedOrigins: string[] = [];
    
    if (process.env.FRONTEND_URL) {
      allowedOrigins = [process.env.FRONTEND_URL];
    } else if (process.env.ALLOWED_ORIGINS) {
      allowedOrigins = process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim());
    }
    
    if (allowedOrigins.length > 0) {
      app.enableCors({
        origin: allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        maxAge: 86400, // 24 hours
      });
    }
  } else {
    // Development: Use ALLOWED_ORIGINS or default to localhost
    const allowed = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',').map((s) => s.trim());
    app.enableCors({
      origin: allowed,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 86400,
    });
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

  // Graceful shutdown handling
  const shutdownTimeout = process.env.SHUTDOWN_TIMEOUT ? Number(process.env.SHUTDOWN_TIMEOUT) : 30000; // 30 seconds default
  const logger = new Logger('Bootstrap');

  const gracefulShutdown = async (signal: string) => {
    logger.log(`Received ${signal}, starting graceful shutdown...`);

    const shutdownTimer = setTimeout(() => {
      logger.error('Graceful shutdown timeout exceeded, forcing exit');
      process.exit(1);
    }, shutdownTimeout);

    try {
      // Close HTTP server (stop accepting new connections)
      await app.close();
      clearTimeout(shutdownTimer);
      logger.log('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      clearTimeout(shutdownTimer);
      logger.error('Error during graceful shutdown', error instanceof Error ? error.stack : String(error));
      process.exit(1);
    }
  };

  // Listen for termination signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught exceptions and unhandled rejections
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', error instanceof Error ? error.stack : String(error));
    gracefulShutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection', reason instanceof Error ? reason.stack : String(reason));
    gracefulShutdown('unhandledRejection');
  });
}

bootstrap();
