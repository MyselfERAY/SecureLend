import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  Optional,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AnalyticsService } from '../../modules/analytics/analytics.service';

@Catch()
@Injectable()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(@Optional() private readonly analyticsService?: AnalyticsService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: Record<string, unknown>;
    let errMsg = '';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      errMsg = exception.message;
      const exResponse = exception.getResponse();

      if (status === HttpStatus.TOO_MANY_REQUESTS) {
        body = {
          status: 'error',
          message: 'Cok fazla istek. Lutfen daha sonra tekrar deneyin.',
          code: 429,
        };
      } else if (status === HttpStatus.UNAUTHORIZED) {
        body = {
          status: 'fail',
          data: { message: exception.message || 'Oturum acmaniz gerekiyor.' },
        };
      } else if (status === HttpStatus.FORBIDDEN) {
        body = {
          status: 'fail',
          data: { message: exception.message || 'Bu isleme yetkiniz yok.' },
        };
      } else if (status === HttpStatus.BAD_REQUEST) {
        const messages =
          typeof exResponse === 'object' && exResponse !== null
            ? (exResponse as Record<string, unknown>)
            : {};

        const validationMessages = Array.isArray(messages['message'])
          ? messages['message']
          : [exception.message];

        body = {
          status: 'fail',
          data: { validation: validationMessages },
        };
      } else if (status === HttpStatus.NOT_FOUND) {
        body = {
          status: 'fail',
          data: { message: exception.message },
        };
      } else if (status === HttpStatus.CONFLICT) {
        body = {
          status: 'fail',
          data: { message: exception.message },
        };
      } else {
        body = {
          status: 'error',
          message: exception.message,
          code: status,
        };
      }
    } else {
      errMsg = exception instanceof Error ? exception.message : String(exception);
      this.logger.error(`Unhandled exception: ${errMsg}`, exception instanceof Error ? exception.stack : '');
      // Never expose internal error details to clients
      body = {
        status: 'error',
        message: 'Bir hata olustu. Lutfen daha sonra tekrar deneyin.',
      };
    }

    // Track API error in analytics (fire-and-forget)
    const url = request?.url || '';
    if (this.analyticsService && !this.shouldSkipTracking(url, status)) {
      const startTime = (request as any)?.__apiStartTime;
      const durationMs = startTime ? Date.now() - startTime : undefined;
      this.analyticsService
        .trackApiError(
          request?.method || 'UNKNOWN',
          url,
          status,
          errMsg,
          exception instanceof Error ? exception.stack : undefined,
          durationMs,
          request,
        )
        .catch(() => {});
    }

    response.status(status).json(body);
  }

  /**
   * Analitik "hata" olarak sayılmaması gereken istekler:
   *  1) Health/analytics/docs endpoint'leri — altyapı, gürültü yapar
   *  2) Auth gürültüsü (401/403) — token süresi dolması ve client-side refresh
   *     sırasında üretilen 401'ler normal davranıştır, gerçek bug değil.
   *     Gerçek yetkisiz erişim vakalarını ayrı bir security-audit kanalına
   *     taşımak istersek bunu ileride gevşetebiliriz.
   *  3) Bot/scanner trafiği — `/.env`, `/.git/*`, `/_profiler/*`, `/wp-*`,
   *     `/phpmyadmin*`, `/robots.txt`, `/.well-known/*` gibi pattern'lar
   *     internet taramalarıdır. `/api/` veya `/health` ile başlamayan
   *     istekler zaten genelde scanner — topluca atlıyoruz.
   */
  private shouldSkipTracking(url: string, status: number): boolean {
    if (
      url === '/health' ||
      url.startsWith('/api/v1/analytics') ||
      url.startsWith('/api/docs') ||
      url.startsWith('/app/')
    ) {
      return true;
    }

    // Scanner trafiği: /api/ veya /health ile başlamayan her şey botturur
    if (!url.startsWith('/api/') && !url.startsWith('/health')) {
      return true;
    }

    // Auth gürültüsü — 401/403 gerçek bug sinyali değil
    if (status === HttpStatus.UNAUTHORIZED || status === HttpStatus.FORBIDDEN) {
      return true;
    }

    return false;
  }
}
