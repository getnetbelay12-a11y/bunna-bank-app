export declare const MAX_LOAN_DOCUMENT_SIZE_BYTES: number;
export declare const MAX_LOAN_DOCUMENTS = 10;
export declare const SAFE_STORAGE_KEY_PATTERN: RegExp;
export declare const SAFE_MIME_TYPE_PATTERN: RegExp;
export declare class CreateLoanDocumentDto {
    documentType: string;
    originalFileName: string;
    storageKey?: string;
    mimeType?: string;
    sizeBytes?: number;
}
