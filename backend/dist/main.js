"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const environment_validation_1 = require("./config/environment.validation");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    const logger = new common_1.Logger('Bootstrap');
    const appConfig = configService.getOrThrow('app');
    const trustProxy = configService.get('APP_TRUST_PROXY') ?? false;
    const allowedOrigins = (0, environment_validation_1.parseAllowedOrigins)(appConfig.corsOrigin);
    const allowAnyOrigin = allowedOrigins.length === 0 || allowedOrigins.includes('*');
    if (trustProxy) {
        app.enable('trust proxy');
    }
    app.enableShutdownHooks();
    app.disable('x-powered-by');
    app.enableCors({
        origin: allowAnyOrigin ? true : allowedOrigins,
        credentials: !allowAnyOrigin,
        methods: ['GET', 'HEAD', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Authorization', 'Content-Type'],
    });
    app.use((_, response, next) => {
        response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        response.setHeader('X-Content-Type-Options', 'nosniff');
        response.setHeader('X-Frame-Options', 'DENY');
        response.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
        response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        next();
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: true,
        transformOptions: { enableImplicitConversion: true },
        validationError: {
            target: false,
            value: false,
        },
    }));
    await app.listen(appConfig.port, appConfig.host);
    logger.log(`API listening on http://${appConfig.host}:${appConfig.port} (${appConfig.nodeEnv})`);
}
void bootstrap().catch((error) => {
    const logger = new common_1.Logger('Bootstrap');
    logger.error('Failed to start API', error instanceof Error ? error.stack : String(error));
    process.exit(1);
});
//# sourceMappingURL=main.js.map