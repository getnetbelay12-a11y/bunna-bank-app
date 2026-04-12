import { ConfigService } from '@nestjs/config';
import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { StorageService } from './storage.service';

describe('StorageService', () => {
  it('writes document metadata to local storage', async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'bunna-storage-'));
    const configService = {
      getOrThrow: jest.fn().mockReturnValue({
        provider: 'local',
        uploadPath: tempDir,
        awsRegion: '',
        s3Bucket: '',
      }),
    } as unknown as ConfigService;

    const service = new StorageService(configService);

    const result = await service.registerDocument({
      domain: 'loans',
      entityId: 'loan_1',
      originalFileName: 'ID Card.pdf',
      payload: {
        documentType: 'id_card',
        mimeType: 'application/pdf',
      },
    });

    expect(result.provider).toBe('local');
    expect(result.storageKey).toContain('loans/loan_1/');
    expect(result.absolutePath).toBeDefined();

    const contents = await readFile(result.absolutePath!, 'utf8');
    expect(contents).toContain('"documentType": "id_card"');
    expect(contents).toContain('"originalFileName": "ID Card.pdf"');
  });

  it('returns an s3 storage key when s3 mode is enabled', async () => {
    const configService = {
      getOrThrow: jest.fn().mockReturnValue({
        provider: 's3',
        uploadPath: 'uploads/',
        awsRegion: 'eu-west-1',
        s3Bucket: 'bucket-1',
      }),
    } as unknown as ConfigService;

    const service = new StorageService(configService);

    const result = await service.registerDocument({
      domain: 'loans',
      entityId: 'loan_2',
      originalFileName: 'Business Plan.pdf',
      payload: { documentType: 'business_plan' },
    });

    expect(result.provider).toBe('s3');
    expect(result.storageKey).toContain('loans/loan_2/');
  });

  it('writes binary document bytes to local storage', async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'bunna-upload-'));
    const configService = {
      getOrThrow: jest.fn().mockReturnValue({
        provider: 'local',
        uploadPath: tempDir,
        awsRegion: '',
        s3Bucket: '',
      }),
    } as unknown as ConfigService;

    const service = new StorageService(configService);

    const result = await service.storeBinaryDocument({
      domain: 'kyc',
      entityId: 'member_1',
      originalFileName: 'front-id.png',
      mimeType: 'image/png',
      buffer: Buffer.from('fake-binary-document'),
      metadata: {
        documentType: 'fayda_front',
      },
    });

    expect(result.provider).toBe('local');
    expect(result.storageKey).toContain('kyc/member_1/');
    expect(result.absolutePath).toBeDefined();
    expect(result.sizeBytes).toBe(Buffer.from('fake-binary-document').byteLength);
    expect(result.sha256Hash).toHaveLength(64);

    const contents = await readFile(result.absolutePath!);
    expect(contents.toString()).toBe('fake-binary-document');
    const metadata = await readFile(`${result.absolutePath!}.json`, 'utf8');
    expect(metadata).toContain('"documentType": "fayda_front"');
    expect(metadata).toContain('"sha256Hash"');
  });

  it('reads stored binary documents and preserves metadata', async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'bunna-upload-read-'));
    const configService = {
      getOrThrow: jest.fn().mockReturnValue({
        provider: 'local',
        uploadPath: tempDir,
        awsRegion: '',
        s3Bucket: '',
      }),
    } as unknown as ConfigService;

    const service = new StorageService(configService);

    const stored = await service.storeBinaryDocument({
      domain: 'service-requests',
      entityId: 'svc_1',
      originalFileName: 'receipt.png',
      mimeType: 'image/png',
      buffer: Buffer.from('evidence-bytes'),
      metadata: {
        documentType: 'receipt',
      },
    });

    const result = await service.readStoredDocument(stored.storageKey);

    expect(result.originalFileName).toBe('receipt.png');
    expect(result.mimeType).toBe('image/png');
    expect(result.buffer.toString()).toBe('evidence-bytes');
    expect(result.sizeBytes).toBe(Buffer.from('evidence-bytes').byteLength);
    expect(result.sha256Hash).toHaveLength(64);
  });

  it('reads stored document metadata without loading content into callers', async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'bunna-upload-meta-'));
    const configService = {
      getOrThrow: jest.fn().mockReturnValue({
        provider: 'local',
        uploadPath: tempDir,
        awsRegion: '',
        s3Bucket: '',
      }),
    } as unknown as ConfigService;

    const service = new StorageService(configService);

    const stored = await service.storeBinaryDocument({
      domain: 'kyc',
      entityId: 'member_9',
      originalFileName: 'selfie.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('selfie-bytes'),
      metadata: {
        documentType: 'selfie',
      },
    });

    const result = await service.getStoredDocumentMetadata(stored.storageKey);

    expect(result.originalFileName).toBe('selfie.jpg');
    expect(result.mimeType).toBe('image/jpeg');
    expect(result.sizeBytes).toBe(Buffer.from('selfie-bytes').byteLength);
    expect(result.sha256Hash).toHaveLength(64);
  });
});
