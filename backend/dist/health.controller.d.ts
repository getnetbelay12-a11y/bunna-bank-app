import { ConfigService } from '@nestjs/config';
import { Connection } from 'mongoose';
export declare class HealthController {
    private readonly connection;
    private readonly configService;
    constructor(connection: Connection, configService: ConfigService);
    getRoot(): {
        status: string;
        service: string;
        message: string;
        port: number;
        health: string;
    };
    getHealth(): {
        status: string;
        service: string;
        port: number;
        database: string;
        databaseName: string;
    };
}
