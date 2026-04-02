import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { AuthenticatedUser } from '../interfaces';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly authService;
    constructor(authService: AuthService, configService: ConfigService);
    validate(payload: AuthenticatedUser): Promise<AuthenticatedUser>;
}
export {};
