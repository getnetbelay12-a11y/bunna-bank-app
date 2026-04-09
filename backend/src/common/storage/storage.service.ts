import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { access, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  RegisterStoredDocumentInput,
  StoredDocumentMetadataResult,
  RetrievedStoredDocumentResult,
  StoreBinaryDocumentInput,
  StoredDocumentResult,
} from './storage.types';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly configService: ConfigService) {}

  async registerDocument(
    input: RegisterStoredDocumentInput,
  ): Promise<StoredDocumentResult> {
    const config = this.configService.getOrThrow<{
      provider: string;
      uploadPath: string;
      awsRegion: string;
      s3Bucket: string;
    }>('storage');

    if (config.provider === 's3') {
      return this.registerS3Document(input);
    }

    return this.registerLocalDocument(input, config.uploadPath);
  }

  async storeBinaryDocument(
    input: StoreBinaryDocumentInput,
  ): Promise<StoredDocumentResult> {
    const config = this.configService.getOrThrow<{
      provider: string;
      uploadPath: string;
      awsRegion: string;
      s3Bucket: string;
    }>('storage');

    if (config.provider === 's3') {
      return this.storeS3BinaryDocument(input);
    }

    return this.storeLocalBinaryDocument(input, config.uploadPath);
  }

  async readStoredDocument(
    storageKey: string,
  ): Promise<RetrievedStoredDocumentResult> {
    const config = this.configService.getOrThrow<{
      provider: string;
      uploadPath: string;
      awsRegion: string;
      s3Bucket: string;
    }>('storage');

    if (config.provider === 's3') {
      return this.readS3StoredDocument(storageKey);
    }

    return this.readLocalStoredDocument(storageKey, config.uploadPath);
  }

  async getStoredDocumentMetadata(
    storageKey: string,
  ): Promise<StoredDocumentMetadataResult> {
    const config = this.configService.getOrThrow<{
      provider: string;
      uploadPath: string;
      awsRegion: string;
      s3Bucket: string;
    }>('storage');

    if (config.provider === 's3') {
      return this.getS3StoredDocumentMetadata(storageKey);
    }

    return this.getLocalStoredDocumentMetadata(storageKey, config.uploadPath);
  }

  private async registerLocalDocument(
    input: RegisterStoredDocumentInput,
    uploadPath: string,
  ): Promise<StoredDocumentResult> {
    const timestamp = Date.now();
    const safeName = this.sanitizeFileName(input.originalFileName);
    const storageKey = path.posix.join(
      input.domain,
      input.entityId,
      `${timestamp}-${safeName}.json`,
    );
    const absoluteBasePath = path.resolve(process.cwd(), uploadPath);
    const absolutePath = path.join(absoluteBasePath, storageKey);

    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(
      absolutePath,
      JSON.stringify(
        {
          ...input.payload,
          originalFileName: input.originalFileName,
          storedAt: new Date().toISOString(),
        },
        null,
        2,
      ),
      'utf8',
    );

    return {
      provider: 'local',
      storageKey,
      absolutePath,
      originalFileName: input.originalFileName,
    };
  }

  private async storeLocalBinaryDocument(
    input: StoreBinaryDocumentInput,
    uploadPath: string,
  ): Promise<StoredDocumentResult> {
    const timestamp = Date.now();
    const safeName = this.sanitizeFileName(input.originalFileName);
    const storageKey = path.posix.join(
      input.domain,
      input.entityId,
      `${timestamp}-${safeName}`,
    );
    const absoluteBasePath = path.resolve(process.cwd(), uploadPath);
    const absolutePath = path.join(absoluteBasePath, storageKey);

    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, input.buffer);

    if (input.metadata != null && Object.keys(input.metadata).length > 0) {
      await writeFile(
        `${absolutePath}.json`,
        JSON.stringify(
          {
            ...input.metadata,
            originalFileName: input.originalFileName,
            mimeType: input.mimeType,
            sizeBytes: input.buffer.byteLength,
            storedAt: new Date().toISOString(),
          },
          null,
          2,
        ),
        'utf8',
      );
    }

    return {
      provider: 'local',
      storageKey,
      absolutePath,
      originalFileName: input.originalFileName,
      mimeType: input.mimeType,
      sizeBytes: input.buffer.byteLength,
    };
  }

  private async readLocalStoredDocument(
    storageKey: string,
    uploadPath: string,
  ): Promise<RetrievedStoredDocumentResult> {
    const absolutePath = this.resolveLocalStoredDocumentPath(storageKey, uploadPath);

    await access(absolutePath);

    const buffer = await readFile(absolutePath);
    const metadata = await this.readLocalMetadata(absolutePath);

    return {
      provider: 'local',
      storageKey,
      originalFileName:
        metadata.originalFileName ?? path.basename(storageKey),
      mimeType: metadata.mimeType,
      buffer,
      sizeBytes:
        typeof metadata.sizeBytes === 'number'
          ? metadata.sizeBytes
          : buffer.byteLength,
    };
  }

  private async getLocalStoredDocumentMetadata(
    storageKey: string,
    uploadPath: string,
  ): Promise<StoredDocumentMetadataResult> {
    const absolutePath = this.resolveLocalStoredDocumentPath(storageKey, uploadPath);
    await access(absolutePath);

    const fileStat = await stat(absolutePath);
    const metadata = await this.readLocalMetadata(absolutePath);

    return {
      provider: 'local',
      storageKey,
      originalFileName: metadata.originalFileName ?? path.basename(storageKey),
      mimeType: metadata.mimeType,
      sizeBytes:
        typeof metadata.sizeBytes === 'number'
          ? metadata.sizeBytes
          : fileStat.size,
    };
  }

  private async registerS3Document(
    input: RegisterStoredDocumentInput,
  ): Promise<StoredDocumentResult> {
    const timestamp = Date.now();
    const safeName = this.sanitizeFileName(input.originalFileName);
    const storageKey = path.posix.join(
      input.domain,
      input.entityId,
      `${timestamp}-${safeName}.json`,
    );

    this.logger.warn(
      `S3 storage is configured, but no S3 client is installed yet. Returning storage key ${storageKey} without upload.`,
    );

    return {
      provider: 's3',
      storageKey,
      originalFileName: input.originalFileName,
    };
  }

  private async storeS3BinaryDocument(
    input: StoreBinaryDocumentInput,
  ): Promise<StoredDocumentResult> {
    const timestamp = Date.now();
    const safeName = this.sanitizeFileName(input.originalFileName);
    const storageKey = path.posix.join(
      input.domain,
      input.entityId,
      `${timestamp}-${safeName}`,
    );

    this.logger.warn(
      `S3 storage is configured, but no S3 client is installed yet. Returning storage key ${storageKey} without upload.`,
    );

    return {
      provider: 's3',
      storageKey,
      originalFileName: input.originalFileName,
      mimeType: input.mimeType,
      sizeBytes: input.buffer.byteLength,
    };
  }

  private async readS3StoredDocument(
    storageKey: string,
  ): Promise<RetrievedStoredDocumentResult> {
    this.logger.warn(
      `S3 storage is configured, but no S3 client is installed yet. Cannot read storage key ${storageKey}.`,
    );

    throw new Error('S3 document retrieval is not implemented yet.');
  }

  private async getS3StoredDocumentMetadata(
    storageKey: string,
  ): Promise<StoredDocumentMetadataResult> {
    this.logger.warn(
      `S3 storage is configured, but no S3 client is installed yet. Cannot read metadata for storage key ${storageKey}.`,
    );

    throw new Error('S3 document metadata retrieval is not implemented yet.');
  }

  private async readLocalMetadata(absolutePath: string) {
    try {
      const metadata = await readFile(`${absolutePath}.json`, 'utf8');
      return JSON.parse(metadata) as {
        originalFileName?: string;
        mimeType?: string;
        sizeBytes?: number;
      };
    } catch {
      return {};
    }
  }

  private resolveLocalStoredDocumentPath(storageKey: string, uploadPath: string) {
    const absoluteBasePath = path.resolve(process.cwd(), uploadPath);
    const absolutePath = path.resolve(absoluteBasePath, storageKey);
    const relativePath = path.relative(absoluteBasePath, absolutePath);

    if (
      relativePath.length === 0 ||
      relativePath.startsWith('..') ||
      path.isAbsolute(relativePath)
    ) {
      throw new Error('Invalid storage key.');
    }

    return absolutePath;
  }

  private sanitizeFileName(fileName: string): string {
    const normalized = fileName.trim().replace(/\s+/g, '-').toLowerCase();
    const safe = normalized.replace(/[^a-z0-9._-]/g, '');
    return safe || 'document';
  }
}
