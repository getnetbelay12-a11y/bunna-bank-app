export interface RegisterStoredDocumentInput {
  domain: string;
  entityId: string;
  originalFileName: string;
  payload: Record<string, unknown>;
}

export interface StoreBinaryDocumentInput {
  domain: string;
  entityId: string;
  originalFileName: string;
  mimeType?: string;
  buffer: Buffer;
  metadata?: Record<string, unknown>;
}

export interface StoredDocumentResult {
  provider: 'local' | 's3';
  storageKey: string;
  absolutePath?: string;
  originalFileName?: string;
  mimeType?: string;
  sizeBytes?: number;
}

export interface RetrievedStoredDocumentResult {
  provider: 'local' | 's3';
  storageKey: string;
  originalFileName: string;
  mimeType?: string;
  buffer: Buffer;
  sizeBytes: number;
}

export interface StoredDocumentMetadataResult {
  provider: 'local' | 's3';
  storageKey: string;
  originalFileName: string;
  mimeType?: string;
  sizeBytes: number;
}
