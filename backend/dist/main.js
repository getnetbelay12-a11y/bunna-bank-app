"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    const appConfig = configService.getOrThrow('app');
    app.enableCors({
        origin: resolveCorsOrigin(appConfig.corsOrigin),
        credentials: false,
        methods: ['GET', 'HEAD', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Authorization', 'Content-Type'],
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    await app.listen(appConfig.port, appConfig.host);
}
function resolveCorsOrigin(corsOrigin) {
    if (!corsOrigin || corsOrigin === '*') {
        return true;
    }
    const origins = corsOrigin
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
    return origins.length <= 1 ? origins[0] : origins;
}
void bootstrap();
//# sourceMappingURL=main.js.map