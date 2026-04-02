"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggingConfig = void 0;
const config_1 = require("@nestjs/config");
exports.loggingConfig = (0, config_1.registerAs)('logging', () => ({
    appName: process.env.APP_NAME ?? 'Bunna Bank API',
    level: process.env.APP_LOG_LEVEL ?? 'log',
}));
//# sourceMappingURL=logging.config.js.map