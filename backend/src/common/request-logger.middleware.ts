import { Injectable, NestMiddleware } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  // Adds a unique id to each request, measures how long it takes,
  // and prints a simple JSON log when the response finishes.
  use(req: any, res: any, next: () => void) {
    const start = Date.now();
    const requestId = req.headers['x-request-id'] || uuidv4();
    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);

    res.on('finish', () => {
      const durationMs = Date.now() - start;
      const log = {
        level: 'info',
        requestId,
        method: req.method,
        url: req.originalUrl || req.url,
        status: res.statusCode,
        durationMs,
        user: req.user ? { id: req.user.userId, role: req.user.role } : null,
      };
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(log));
    });

    next();
  }
}
