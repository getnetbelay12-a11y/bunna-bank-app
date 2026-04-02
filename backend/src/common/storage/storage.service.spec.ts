import { NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { StorageService } from './storage.service';

describe('StorageService', () => {
  it('writes document metadata to local storage', async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'amhara-storage-'));
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

  it('fails closed when s3 mode is enabled without an implemented client', async () => {
    const configService = {
      getOrThrow: jest.fn().mockReturnValue({
        provider: 's3',
        uploadPath: 'uploads/',
        awsRegion: 'eu-west-1',
        s3Bucket: 'bucket-1',
      }),
    } as unknown as ConfigService;

    const service = new StorageService(configService);

    await expect(
      service.registerDocument({
        domain: 'loans',
        entityId: 'loan_2',
        originalFileName: 'Business Plan.pdf',
        payload: { documentType: 'business_plan' },
      }),
    ).rejects.toBeInstanceOf(NotImplementedException);
  });
});
