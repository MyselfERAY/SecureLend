import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const serviceKey = process.env.SERVICE_API_KEY;
    if (serviceKey) {
      const request = context.switchToHttp().getRequest();
      const provided = request.headers['x-api-key'];
      if (provided && provided === serviceKey) {
        request.user = { id: 'service', roles: ['SERVICE'] };
        return true;
      }
    }

    return super.canActivate(context);
  }
}
