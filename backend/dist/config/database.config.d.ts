import { Connection } from 'mongoose';
export declare const databaseConfig: (() => {
    uri: string;
    databaseName: string;
    host: string;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    uri: string;
    databaseName: string;
    host: string;
}>;
export declare function logMongoConnection(connection: Connection, fallbackUri?: string): Connection;
