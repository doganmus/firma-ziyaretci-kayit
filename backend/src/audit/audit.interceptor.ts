import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
    const now = Date.now();
    const req = context.switchToHttp().getRequest();
    const method = req.method as string;
    const path = req.originalUrl || req.url;
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || null;
    const user = req.user as { userId?: string; email?: string; role?: string } | undefined;
    const userId = (user as any)?.userId || null;
    const userRole = (user as any)?.role || null;
    const userEmail = (user as any)?.email || null;
    const userAgent = req.headers['user-agent'] || null;

    // Metrics/health/docs gibi uçları audit dışı bırak
    if (path === '/metrics' || path === '/health' || path?.startsWith('/docs')) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        try {
          const res = context.switchToHttp().getResponse();
          const durationMs = Date.now() - now;
          const statusCode = res.statusCode;
          // Hataları yut: tablo yoksa (42P01) ya da ilk kurulumda DB hazır değilse app çökmesin
          this.audit
            .write({ method, path, statusCode, durationMs, userId, userRole, userEmail, ip, userAgent })
            .catch(() => void 0);
        } catch {
          // ignore
        }
      })
    );
  }
}


