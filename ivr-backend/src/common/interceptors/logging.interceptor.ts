import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, body, query, params } = request;
    const userAgent = request.get('user-agent') || '';
    const ip = request.ip;
    const userId = (request as any).user?.id;

    const now = Date.now();

    // Log request
    this.logger.log(
      JSON.stringify({
        type: 'REQUEST',
        timestamp: new Date().toISOString(),
        method,
        url,
        userId,
        ip,
        userAgent,
        ...(Object.keys(query).length > 0 && { query }),
        ...(Object.keys(params).length > 0 && { params }),
        ...(method !== 'GET' && body && { body: this.sanitizeBody(body) }),
      }),
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - now;
          const statusCode = response.statusCode;

          // Log response
          this.logger.log(
            JSON.stringify({
              type: 'RESPONSE',
              timestamp: new Date().toISOString(),
              method,
              url,
              statusCode,
              duration: `${duration}ms`,
              userId,
            }),
          );
        },
        error: (error) => {
          const duration = Date.now() - now;

          // Error logging is handled by exception filter
          this.logger.error(
            JSON.stringify({
              type: 'ERROR',
              timestamp: new Date().toISOString(),
              method,
              url,
              duration: `${duration}ms`,
              userId,
              error: error.message,
            }),
          );
        },
      }),
    );
  }

  private sanitizeBody(body: any): any {
    // Remove sensitive fields from logs
    const sanitized = { ...body };
    const sensitiveFields = [
      'password',
      'passwordHash',
      'token',
      'accessToken',
      'refreshToken',
      'apiKey',
      'secret',
    ];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }
}
