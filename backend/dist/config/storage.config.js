"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageConfig = void 0;
const config_1 = require("@nestjs/config");
exports.storageConfig = (0, config_1.registerAs)('storage', () => ({
    provider: process.env.STORAGE_PROVIDER ?? 'local',
    uploadPath: process.env.FILE_UPLOAD_PATH ?? 'uploads/',
    awsRegion: process.env.AWS_REGION ?? '',
    s3Bucket: process.env.AWS_S3_BUCKET ?? '',
}));
//# sourceMappingURL=storage.config.js.map