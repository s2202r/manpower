import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';

export const IS_PUBLIC_KEY = 'isPublic';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authHeader: string = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.slice(7);

    let payload: any;
    try {
      const secret = this.configService.get<string>('SUPABASE_JWT_SECRET');
      payload = jwt.verify(token, secret, { algorithms: ['HS256'] });
    } catch (err) {
      this.logger.warn(`JWT verification failed: ${err.message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }

    const supabaseId: string = payload.sub;
    if (!supabaseId) {
      throw new UnauthorizedException('Token missing sub claim');
    }

    // Load or lazily create user record
    let user = await this.prisma.user.findUnique({ where: { supabaseId } });
    if (!user) {
      // Auto-provision on first authenticated call; role defaults to CUSTOMER
      const email: string = payload.email ?? null;
      const phone: string = payload.phone ?? null;
      user = await this.prisma.user.create({
        data: {
          supabaseId,
          email,
          phone,
          role: 'CUSTOMER',
        },
      });
      this.logger.log(`Auto-provisioned user ${supabaseId}`);
    }

    request.user = user;
    return true;
  }
}
