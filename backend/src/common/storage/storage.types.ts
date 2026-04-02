export interface RegisterStoredDocumentInput {
  domain: string;
  entityId: string;
  originalFileName: string;
  payload: Record<string, unknown>;
}

export interface StoredDocumentResult {
  provider: 'local' | 's3';
  storageKey: string;
  absolutePath?: string;
}
