import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global exception filter that catches all HTTP exceptions and formats them consistently.
 * In production, stack traces are hidden to prevent information leakage.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = (request as any).requestId || null;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';
    let details: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || exception.message || 'An error occurred';
        error = responseObj.error || exception.name || 'Error';
        details = responseObj.details || null;
      } else {
        message = exception.message || 'An error occurred';
      }

      // Special handling for common exception types
      if (exception.constructor.name === 'BadRequestException') {
        error = 'Bad Request';
      } else if (exception.constructor.name === 'UnauthorizedException') {
        error = 'Unauthorized';
      } else if (exception.constructor.name === 'ForbiddenException') {
        error = 'Forbidden';
      } else if (exception.constructor.name === 'NotFoundException') {
        error = 'Not Found';
      } else if (exception.constructor.name === 'ThrottlerException') {
        error = 'Too Many Requests';
        message = 'Rate limit exceeded. Please try again later.';
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    }

    // Log the error (with stack trace in development only)
    const isProduction = process.env.NODE_ENV === 'production';
    const logContext = {
      requestId,
      method: request.method,
      url: request.originalUrl || request.url,
      status,
      error: error,
      message: message,
      user: (request as any).user ? { id: (request as any).user.userId, role: (request as any).user.role } : null,
    };

    if (isProduction) {
      // In production, log without stack trace
      if (status >= 500) {
        this.logger.error(JSON.stringify(logContext));
      } else {
        this.logger.warn(JSON.stringify(logContext));
      }
    } else {
      // In development, log with full details
      if (status >= 500) {
        this.logger.error(JSON.stringify(logContext), exception instanceof Error ? exception.stack : '');
      } else {
        this.logger.warn(JSON.stringify(logContext));
      }
    }

    // Prepare response
    const responseBody: any = {
      statusCode: status,
      error: error,
      message: message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Add request ID if available
    if (requestId) {
      responseBody.requestId = requestId;
    }

    // Add details if available (but not in production for security)
    if (details && !isProduction) {
      responseBody.details = details;
    }

    // In production, hide internal error details for 500 errors
    if (isProduction && status >= 500) {
      responseBody.message = 'An internal server error occurred';
      responseBody.error = 'Internal Server Error';
      delete responseBody.details;
    }

    // Hide database error details in production
    if (isProduction && message && (
      message.includes('database') ||
      message.includes('connection') ||
      message.includes('SQL') ||
      message.includes('query')
    )) {
      responseBody.message = 'A database error occurred';
    }

    response.status(status).json(responseBody);
  }
}

