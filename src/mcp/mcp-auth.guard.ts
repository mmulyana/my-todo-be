import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request, Response } from 'express';
import { TokensService } from '@/tokens/tokens.service';

// note: Endpoint MCP memakai personal access token dari TokensService, bukan JWT FE cuma 15 menit. JWT masih diterima untuk testing doang ingat
@Injectable()
export class McpAuthGuard implements CanActivate {
  constructor(
    private readonly tokensService: TokensService,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const header = req.headers['authorization'];
    const token =
      typeof header === 'string'
        ? header.replace(/^Bearer\s+/i, '')
        : undefined;

    if (!token) {
      throw this.unauthorized(context);
    }

    if (token.startsWith('mtd_')) {
      const result = await this.tokensService.validate(token);
      if (!result) {
        throw this.unauthorized(context);
      }
      (req as Request & { user: typeof result }).user = result;
      return true;
    }

    try {
      const payload = this.jwtService.verify<{ userId: string }>(token, {
        secret: process.env.JWT_SECRET,
      });
      (req as Request & { user: { userId: string } }).user = {
        userId: payload.userId,
      };
      return true;
    } catch {
      throw this.unauthorized(context);
    }
  }

  private unauthorized(context: ExecutionContext) {
    const res = context.switchToHttp().getResponse<Response>();
    res.setHeader('WWW-Authenticate', 'Bearer');
    return new UnauthorizedException();
  }
}
