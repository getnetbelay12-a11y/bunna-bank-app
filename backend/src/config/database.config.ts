import { Logger } from '@nestjs/common';
import { registerAs } from '@nestjs/config';
import { Connection } from 'mongoose';

import {
  DEFAULT_MONGODB_URI,
  normalizeMongoUri,
  parseMongoConnectionDetails,
} from './environment.validation';

export const databaseConfig = registerAs('database', () => {
  const uri = normalizeMongoUri(process.env.MONGODB_URI ?? DEFAULT_MONGODB_URI);
  const { databaseName, host } = parseMongoConnectionDetails(uri);

  return {
    uri,
    databaseName,
    host,
  };
});

export function logMongoConnection(
  connection: Connection,
  fallbackUri?: string,
): Connection {
  const logger = new Logger('Database');
  const databaseName =
    connection.db?.databaseName ||
    parseMongoConnectionDetails(fallbackUri ?? DEFAULT_MONGODB_URI).databaseName;
  const host =
    connection.host ||
    parseMongoConnectionDetails(fallbackUri ?? DEFAULT_MONGODB_URI).host;

  logger.log(`Connected to MongoDB database: ${databaseName}`);
  logger.log(`Mongo host: ${host}`);

  return connection;
}
