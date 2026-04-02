type EnvironmentRecord = Record<string, unknown>;
declare const DEFAULT_MONGODB_URI = "mongodb://localhost:27017/cbe_bank_app";
export declare function parseAllowedOrigins(value: string): string[];
export declare function normalizeMongoUri(uri: string): string;
export declare function parseMongoConnectionDetails(uri: string): {
    databaseName: string;
    host: string;
};
export declare function validateEnvironment(config: EnvironmentRecord): EnvironmentRecord;
export { DEFAULT_MONGODB_URI };
