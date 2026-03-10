import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { maskTckn } from '@securelend/shared';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body } = request;
    const now = Date.now();

    const maskedBody = this.maskSensitiveData(body);
    this.logger.log(`>> ${method} ${url} - Body: ${JSON.stringify(maskedBody)}`);

    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - now;
        this.logger.log(`<< ${method} ${url} - ${ms}ms`);
      }),
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
