import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UserService } from '../../service/user.service';

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    role: string;
    phone: string;
  };
}

@Injectable()
export class IpRestrictionMiddleware implements NestMiddleware {
  constructor(private readonly userService: UserService) {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    // Agar user authentication mavjud bo'lsa IP tekshirish
    if (req.user && req.user.id) {
      const clientIp = this.getClientIp(req);
      const hasAccess = await this.userService.checkIpAccess(req.user.id, clientIp);
      
      if (!hasAccess) {
        throw new HttpException(
          'Access denied from this IP address',
          HttpStatus.FORBIDDEN,
        );
      }
    }
    
    next();
  }

  private getClientIp(req: Request): string {
    return (
      req.headers['x-forwarded-for'] as string ||
      req.headers['x-real-ip'] as string ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      '127.0.0.1'
    ).split(',')[0].trim();
  }
}
