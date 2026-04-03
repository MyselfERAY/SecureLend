import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: Record<string, unknown>;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
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
      this.logger.error('Unhandled exception', exception);
      body = {
        status: 'error',
        message: 'Bir hata olustu. Lutfen daha sonra tekrar deneyin.',
      };
    }

    response.status(status).json(body);
  }
}
