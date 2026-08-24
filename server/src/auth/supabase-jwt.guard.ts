import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { JWTVerifyGetKey } from 'jose';
import { AuthenticatedRequest } from './authenticated-request.interface';
import { AuthenticatedUser } from './authenticated-user.interface';

interface SupabaseAuthUserResponse {
  id?: unknown;
  email?: unknown;
  role?: unknown;
}

@Injectable()
export class SupabaseJwtGuard implements CanActivate {
  private jwks?: JWTVerifyGetKey;

  constructor(private readonly configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request.headers.authorization);
    const supabaseUrl = this.getSupabaseUrl();

    try {
      request.user = await this.verifyWithJwks(token, supabaseUrl);
    } catch {
      request.user = await this.verifyWithAuthServer(token, supabaseUrl);
    }

    return true;
  }

  private extractBearerToken(authorization?: string): string {
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('A bearer token is required');
    }

    const token = authorization.slice('Bearer '.length).trim();
    if (!token) {
      throw new UnauthorizedException('A bearer token is required');
    }

    return token;
  }

  private getSupabaseUrl(): string {
    const url = this.configService.get<string>('SUPABASE_URL');
    if (!url) {
      throw new InternalServerErrorException('SUPABASE_URL is not configured');
    }

    return url.replace(/\/$/, '');
  }

  private async verifyWithJwks(
    token: string,
    supabaseUrl: string,
  ): Promise<AuthenticatedUser> {
    const { createRemoteJWKSet, jwtVerify } = await import('jose');
    this.jwks ??= createRemoteJWKSet(
      new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`),
    );

    const { payload } = await jwtVerify(token, this.jwks, {
      issuer: `${supabaseUrl}/auth/v1`,
      audience: this.configService.get('SUPABASE_JWT_AUDIENCE', 'authenticated'),
    });

    return this.toAuthenticatedUser(payload);
  }

  private async verifyWithAuthServer(
    token: string,
    supabaseUrl: string,
  ): Promise<AuthenticatedUser> {
    const publishableKey = this.configService.get<string>(
      'SUPABASE_PUBLISHABLE_KEY',
    );
    if (!publishableKey) {
      throw new InternalServerErrorException(
        'SUPABASE_PUBLISHABLE_KEY is required when JWKS verification is unavailable',
      );
    }

    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: publishableKey,
        authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    const user = (await response.json()) as SupabaseAuthUserResponse;
    if (typeof user.id !== 'string') {
      throw new UnauthorizedException('Invalid Supabase user response');
    }

    return {
      id: user.id,
      email: typeof user.email === 'string' ? user.email : null,
      role: typeof user.role === 'string' ? user.role : null,
    };
  }

  private toAuthenticatedUser(payload: {
    sub?: unknown;
    email?: unknown;
    role?: unknown;
  }): AuthenticatedUser {
    if (typeof payload.sub !== 'string') {
      throw new UnauthorizedException('Access token has no user identifier');
    }

    return {
      id: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : null,
      role: typeof payload.role === 'string' ? payload.role : null,
    };
  }
}
