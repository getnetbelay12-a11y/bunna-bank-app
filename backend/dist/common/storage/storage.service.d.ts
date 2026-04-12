import { ConfigService } from '@nestjs/config';
import { RegisterStoredDocumentInput, StoredDocumentMetadataResult, RetrievedStoredDocumentResult, StoreBinaryDocumentInput, StoredDocumentResult } from './storage.types';
export declare class StorageService {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService);
    registerDocument(input: RegisterStoredDocumentInput): Promise<StoredDocumentResult>;
    storeBinaryDocument(input: StoreBinaryDocumentInput): Promise<StoredDocumentResult>;
    readStoredDocument(storageKey: string): Promise<RetrievedStoredDocumentResult>;
    getStoredDocumentMetadata(storageKey: string): Promise<StoredDocumentMetadataResult>;
    private registerLocalDocument;
    private storeLocalBinaryDocument;
    private readLocalStoredDocument;
    private getLocalStoredDocumentMetadata;
    private registerS3Document;
    private storeS3BinaryDocument;
    private readS3StoredDocument;
    private getS3StoredDocumentMetadata;
    private readLocalMetadata;
    private computeSha256;
    private resolveLocalStoredDocumentPath;
    private sanitizeFileName;
}
