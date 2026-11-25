import type { Request } from 'express';
import type { UserRole } from '../../users/user.entity';

// The data stored inside the JWT token
export interface JwtPayload {
  sub: number; // user id ("subject" of the token)
  email: string;
  role: UserRole;
}

// A request that has passed JwtAuthGuard has the decoded token attached as "user"
export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}
