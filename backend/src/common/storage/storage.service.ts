import { Injectable, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  RegisterStoredDocumentInput,
  StoredDocumentResult,
} from './storage.types';

@Injectable()
export class StorageService {
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

    throw new NotImplementedException(
      `S3 storage is configured for ${storageKey}, but the upload client is not implemented in this repo yet.`,
    );
  }

  private sanitizeFileName(fileName: string): string {
    const normalized = fileName.trim().replace(/\s+/g, '-').toLowerCase();
    const safe = normalized.replace(/[^a-z0-9._-]/g, '');
    return safe || 'document';
  }
}
