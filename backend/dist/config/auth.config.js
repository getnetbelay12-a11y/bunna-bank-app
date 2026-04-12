"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authConfig = void 0;
const config_1 = require("@nestjs/config");
exports.authConfig = (0, config_1.registerAs)('auth', () => ({
    accessTokenExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
    refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    jwtIssuer: 'bunna-bank-api',
    jwtAudience: 'bunna-bank-clients',
    jwtSecret: process.env.JWT_SECRET ?? 'CHANGE_THIS_SECRET',
}));
//# sourceMappingURL=auth.config.js.map