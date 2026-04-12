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
var StorageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const node_crypto_1 = require("node:crypto");
const promises_1 = require("node:fs/promises");
const node_path_1 = __importDefault(require("node:path"));
let StorageService = StorageService_1 = class StorageService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(StorageService_1.name);
    }
    async registerDocument(input) {
        const config = this.configService.getOrThrow('storage');
        if (config.provider === 's3') {
            return this.registerS3Document(input);
        }
        return this.registerLocalDocument(input, config.uploadPath);
    }
    async storeBinaryDocument(input) {
        const config = this.configService.getOrThrow('storage');
        if (config.provider === 's3') {
            return this.storeS3BinaryDocument(input);
        }
        return this.storeLocalBinaryDocument(input, config.uploadPath);
    }
    async readStoredDocument(storageKey) {
        const config = this.configService.getOrThrow('storage');
        if (config.provider === 's3') {
            return this.readS3StoredDocument(storageKey);
        }
        return this.readLocalStoredDocument(storageKey, config.uploadPath);
    }
    async getStoredDocumentMetadata(storageKey) {
        const config = this.configService.getOrThrow('storage');
        if (config.provider === 's3') {
            return this.getS3StoredDocumentMetadata(storageKey);
        }
        return this.getLocalStoredDocumentMetadata(storageKey, config.uploadPath);
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
            originalFileName: input.originalFileName,
        };
    }
    async storeLocalBinaryDocument(input, uploadPath) {
        const sha256Hash = this.computeSha256(input.buffer);
        const timestamp = Date.now();
        const safeName = this.sanitizeFileName(input.originalFileName);
        const storageKey = node_path_1.default.posix.join(input.domain, input.entityId, `${timestamp}-${safeName}`);
        const absoluteBasePath = node_path_1.default.resolve(process.cwd(), uploadPath);
        const absolutePath = node_path_1.default.join(absoluteBasePath, storageKey);
        await (0, promises_1.mkdir)(node_path_1.default.dirname(absolutePath), { recursive: true });
        await (0, promises_1.writeFile)(absolutePath, input.buffer);
        if (input.metadata != null && Object.keys(input.metadata).length > 0) {
            await (0, promises_1.writeFile)(`${absolutePath}.json`, JSON.stringify({
                ...input.metadata,
                originalFileName: input.originalFileName,
                mimeType: input.mimeType,
                sizeBytes: input.buffer.byteLength,
                sha256Hash,
                storedAt: new Date().toISOString(),
            }, null, 2), 'utf8');
        }
        return {
            provider: 'local',
            storageKey,
            absolutePath,
            originalFileName: input.originalFileName,
            mimeType: input.mimeType,
            sizeBytes: input.buffer.byteLength,
            sha256Hash,
        };
    }
    async readLocalStoredDocument(storageKey, uploadPath) {
        const absolutePath = this.resolveLocalStoredDocumentPath(storageKey, uploadPath);
        await (0, promises_1.access)(absolutePath);
        const buffer = await (0, promises_1.readFile)(absolutePath);
        const metadata = await this.readLocalMetadata(absolutePath);
        return {
            provider: 'local',
            storageKey,
            originalFileName: metadata.originalFileName ?? node_path_1.default.basename(storageKey),
            mimeType: metadata.mimeType,
            buffer,
            sizeBytes: typeof metadata.sizeBytes === 'number'
                ? metadata.sizeBytes
                : buffer.byteLength,
            sha256Hash: metadata.sha256Hash,
        };
    }
    async getLocalStoredDocumentMetadata(storageKey, uploadPath) {
        const absolutePath = this.resolveLocalStoredDocumentPath(storageKey, uploadPath);
        await (0, promises_1.access)(absolutePath);
        const fileStat = await (0, promises_1.stat)(absolutePath);
        const metadata = await this.readLocalMetadata(absolutePath);
        return {
            provider: 'local',
            storageKey,
            originalFileName: metadata.originalFileName ?? node_path_1.default.basename(storageKey),
            mimeType: metadata.mimeType,
            sizeBytes: typeof metadata.sizeBytes === 'number'
                ? metadata.sizeBytes
                : fileStat.size,
            sha256Hash: metadata.sha256Hash,
        };
    }
    async registerS3Document(input) {
        const timestamp = Date.now();
        const safeName = this.sanitizeFileName(input.originalFileName);
        const storageKey = node_path_1.default.posix.join(input.domain, input.entityId, `${timestamp}-${safeName}.json`);
        this.logger.warn(`S3 storage is configured, but no S3 client is installed yet. Returning storage key ${storageKey} without upload.`);
        return {
            provider: 's3',
            storageKey,
            originalFileName: input.originalFileName,
        };
    }
    async storeS3BinaryDocument(input) {
        const timestamp = Date.now();
        const safeName = this.sanitizeFileName(input.originalFileName);
        const storageKey = node_path_1.default.posix.join(input.domain, input.entityId, `${timestamp}-${safeName}`);
        this.logger.warn(`S3 storage is configured, but no S3 client is installed yet. Returning storage key ${storageKey} without upload.`);
        return {
            provider: 's3',
            storageKey,
            originalFileName: input.originalFileName,
            mimeType: input.mimeType,
            sizeBytes: input.buffer.byteLength,
            sha256Hash: this.computeSha256(input.buffer),
        };
    }
    async readS3StoredDocument(storageKey) {
        this.logger.warn(`S3 storage is configured, but no S3 client is installed yet. Cannot read storage key ${storageKey}.`);
        throw new Error('S3 document retrieval is not implemented yet.');
    }
    async getS3StoredDocumentMetadata(storageKey) {
        this.logger.warn(`S3 storage is configured, but no S3 client is installed yet. Cannot read metadata for storage key ${storageKey}.`);
        throw new Error('S3 document metadata retrieval is not implemented yet.');
    }
    async readLocalMetadata(absolutePath) {
        try {
            const metadata = await (0, promises_1.readFile)(`${absolutePath}.json`, 'utf8');
            return JSON.parse(metadata);
        }
        catch {
            return {};
        }
    }
    computeSha256(buffer) {
        return (0, node_crypto_1.createHash)('sha256').update(buffer).digest('hex');
    }
    resolveLocalStoredDocumentPath(storageKey, uploadPath) {
        const absoluteBasePath = node_path_1.default.resolve(process.cwd(), uploadPath);
        const absolutePath = node_path_1.default.resolve(absoluteBasePath, storageKey);
        const relativePath = node_path_1.default.relative(absoluteBasePath, absolutePath);
        if (relativePath.length === 0 ||
            relativePath.startsWith('..') ||
            node_path_1.default.isAbsolute(relativePath)) {
            throw new Error('Invalid storage key.');
        }
        return absolutePath;
    }
    sanitizeFileName(fileName) {
        const normalized = fileName.trim().replace(/\s+/g, '-').toLowerCase();
        const safe = normalized.replace(/[^a-z0-9._-]/g, '');
        return safe || 'document';
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = StorageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StorageService);
//# sourceMappingURL=storage.service.js.map