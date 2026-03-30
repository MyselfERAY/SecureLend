import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class ValidationGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const { body } = request;

    // Basic validation checks
    if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') {
      if (!body || Object.keys(body).length === 0) {
        throw new BadRequestException('Request body cannot be empty');
      }
    }

    return true;
  }
}