import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  Optional,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { maskTckn } from '@securelend/shared';
import { AnalyticsService } from '../../modules/analytics/analytics.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  constructor(@Optional() private readonly analyticsService?: AnalyticsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body } = request;
    const now = Date.now();

    // Store start time for exception filter duration calculation
    (request as any).__apiStartTime = now;

    const maskedBody = this.maskSensitiveData(body);
    this.logger.log(`>> ${method} ${url} - Body: ${JSON.stringify(maskedBody)}`);

    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - now;
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;
        this.logger.log(`<< ${method} ${url} - ${statusCode} - ${ms}ms`);

        // Track API request in analytics (fire-and-forget)
        if (this.analyticsService && !this.shouldSkipTracking(url)) {
          this.analyticsService
            .trackApiRequest(method, url, statusCode, ms, request)
            .catch(() => {});
        }
      }),
    );
  }

  private shouldSkipTracking(url: string): boolean {
    return (
      url === '/health' ||
      url.startsWith('/api/v1/analytics') ||
      url.startsWith('/api/docs') ||
      url.startsWith('/app/')
    );
  }

  // Keys that must never be logged in clear (compared case-insensitively)
  private static readonly REDACT_KEYS = new Set([
    'code', 'otp', 'refreshtoken', 'accesstoken', 'token',
    'authorization', 'password', 'secret', 'apikey', 'x-api-key',
  ]);
  // Keys shown only partially (KVKK personal data)
  private static readonly PARTIAL_KEYS = new Set([
    'email', 'iban', 'toiban', 'accountnumber', 'address',
  ]);

  /** Recursively masks sensitive fields at any nesting depth. */
  private maskSensitiveData(obj: unknown, depth = 0): unknown {
    if (depth > 6 || obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
      return obj.map((v) => this.maskSensitiveData(v, depth + 1));
    }

    const clone: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const k = key.toLowerCase();
      if (typeof value === 'string') {
        if (k === 'tckn') {
          clone[key] = maskTckn(value);
        } else if (k === 'phone') {
          clone[key] = value.length > 4
            ? '*'.repeat(value.length - 4) + value.slice(-4)
            : '****';
        } else if (LoggingInterceptor.REDACT_KEYS.has(k)) {
          clone[key] = '***REDACTED***';
        } else if (LoggingInterceptor.PARTIAL_KEYS.has(k)) {
          clone[key] = value.length <= 4
            ? '****'
            : value.slice(0, 2) + '*'.repeat(Math.max(1, value.length - 4)) + value.slice(-2);
        } else {
          clone[key] = value;
        }
      } else {
        clone[key] = this.maskSensitiveData(value, depth + 1);
      }
    }
    return clone;
  }
}
