import { ConfigService } from '@nestjs/config';
import { RegisterStoredDocumentInput, StoredDocumentResult } from './storage.types';
export declare class StorageService {
    private readonly configService;
    constructor(configService: ConfigService);
    registerDocument(input: RegisterStoredDocumentInput): Promise<StoredDocumentResult>;
    private registerLocalDocument;
    private registerS3Document;
    private sanitizeFileName;
}
