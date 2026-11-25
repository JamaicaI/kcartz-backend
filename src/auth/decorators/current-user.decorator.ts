import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type {
  AuthenticatedRequest,
  JwtPayload,
} from '../interfaces/jwt-payload.interface';

// Usage: @CurrentUser() user: JwtPayload  -> gives the logged-in user's token data
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): JwtPayload => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);
