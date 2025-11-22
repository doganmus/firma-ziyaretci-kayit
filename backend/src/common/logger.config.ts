import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';

/**
 * Winston logger configuration
 * - Production: JSON format for structured logging
 * - Development: Pretty format for readability
 */
export function createWinstonConfig(): WinstonModuleOptions {
  const isProduction = process.env.NODE_ENV === 'production';
  const logLevel = process.env.LOG_LEVEL || 'info';

  const transports: winston.transport[] = [
    // Console transport (always enabled)
    new winston.transports.Console({
      format: isProduction
        ? winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json(),
          )
        : winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.colorize(),
            winston.format.printf((info: any) => {
              const { timestamp, level, message, context, ...meta } = info;
              const contextStr = context ? `[${context}]` : '';
              const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
              return `${timestamp} ${level} ${contextStr} ${message} ${metaStr}`;
            }),
          ),
    }),
  ];

  return {
    level: logLevel,
    transports,
    // Global default metadata
    defaultMeta: {
      service: 'backend',
      environment: process.env.NODE_ENV || 'development',
    },
  };
}

