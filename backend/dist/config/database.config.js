"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseConfig = void 0;
exports.logMongoConnection = logMongoConnection;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const environment_validation_1 = require("./environment.validation");
exports.databaseConfig = (0, config_1.registerAs)('database', () => {
    const uri = (0, environment_validation_1.normalizeMongoUri)(process.env.MONGODB_URI ?? environment_validation_1.DEFAULT_MONGODB_URI);
    const { databaseName, host } = (0, environment_validation_1.parseMongoConnectionDetails)(uri);
    return {
        uri,
        databaseName,
        host,
    };
});
function logMongoConnection(connection, fallbackUri) {
    const logger = new common_1.Logger('Database');
    const databaseName = connection.db?.databaseName ||
        (0, environment_validation_1.parseMongoConnectionDetails)(fallbackUri ?? environment_validation_1.DEFAULT_MONGODB_URI).databaseName;
    const host = connection.host ||
        (0, environment_validation_1.parseMongoConnectionDetails)(fallbackUri ?? environment_validation_1.DEFAULT_MONGODB_URI).host;
    logger.log(`Connected to MongoDB database: ${databaseName}`);
    logger.log(`Mongo host: ${host}`);
    return connection;
}
//# sourceMappingURL=database.config.js.map