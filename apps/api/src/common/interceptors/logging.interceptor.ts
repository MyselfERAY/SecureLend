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

  private maskSensitiveData(obj: unknown): unknown {
    if (!obj || typeof obj !== 'object') return obj;
    const clone = { ...(obj as Record<string, unknown>) };

    // Mask TCKN
    if (typeof clone['tckn'] === 'string') {
      clone['tckn'] = maskTckn(clone['tckn']);
    }

    // Mask phone number (show last 4 digits)
    if (typeof clone['phone'] === 'string') {
      const phone = clone['phone'] as string;
      clone['phone'] = phone.length > 4
        ? '*'.repeat(phone.length - 4) + phone.slice(-4)
        : '****';
    }

    // Mask OTP code
    if (typeof clone['code'] === 'string') {
      clone['code'] = '******';
    }

    // Mask refresh tokens
    if (typeof clone['refreshToken'] === 'string') {
      clone['refreshToken'] = '***REDACTED***';
    }

    return clone;
  }
}
