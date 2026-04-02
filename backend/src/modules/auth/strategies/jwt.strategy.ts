import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { AuthService } from '../auth.service';
import { AuthenticatedUser } from '../interfaces';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,
    configService: ConfigService,
  ) {
    const auth = configService.getOrThrow<{
      jwtSecret: string;
      jwtIssuer: string;
      jwtAudience: string;
    }>('auth');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: auth.jwtSecret,
      issuer: auth.jwtIssuer,
      audience: auth.jwtAudience,
    });
  }

  validate(payload: AuthenticatedUser) {
    return this.authService.validateJwtPayload(payload);
  }
}
