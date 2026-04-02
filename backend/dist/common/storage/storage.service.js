"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const promises_1 = require("node:fs/promises");
const node_path_1 = __importDefault(require("node:path"));
let StorageService = class StorageService {
    constructor(configService) {
        this.configService = configService;
    }
    async registerDocument(input) {
        const config = this.configService.getOrThrow('storage');
        if (config.provider === 's3') {
            return this.registerS3Document(input);
        }
        return this.registerLocalDocument(input, config.uploadPath);
    }
    async registerLocalDocument(input, uploadPath) {
        const timestamp = Date.now();
        const safeName = this.sanitizeFileName(input.originalFileName);
        const storageKey = node_path_1.default.posix.join(input.domain, input.entityId, `${timestamp}-${safeName}.json`);
        const absoluteBasePath = node_path_1.default.resolve(process.cwd(), uploadPath);
        const absolutePath = node_path_1.default.join(absoluteBasePath, storageKey);
        await (0, promises_1.mkdir)(node_path_1.default.dirname(absolutePath), { recursive: true });
        await (0, promises_1.writeFile)(absolutePath, JSON.stringify({
            ...input.payload,
            originalFileName: input.originalFileName,
            storedAt: new Date().toISOString(),
        }, null, 2), 'utf8');
        return {
            provider: 'local',
            storageKey,
            absolutePath,
        };
    }
    async registerS3Document(input) {
        const timestamp = Date.now();
        const safeName = this.sanitizeFileName(input.originalFileName);
        const storageKey = node_path_1.default.posix.join(input.domain, input.entityId, `${timestamp}-${safeName}.json`);
        throw new common_1.NotImplementedException(`S3 storage is configured for ${storageKey}, but the upload client is not implemented in this repo yet.`);
    }
    sanitizeFileName(fileName) {
        const normalized = fileName.trim().replace(/\s+/g, '-').toLowerCase();
        const safe = normalized.replace(/[^a-z0-9._-]/g, '');
        return safe || 'document';
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StorageService);
//# sourceMappingURL=storage.service.js.map