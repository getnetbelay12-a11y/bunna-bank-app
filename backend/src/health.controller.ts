import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Controller()
export class HealthController {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  getRoot() {
    return {
      status: 'ok',
      service: 'Bunna backend',
      message: 'Bunna backend is running.',
      port: this.configService.get<number>('app.port') ?? 4000,
      health: '/health',
    };
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'Bunna backend',
      port: this.configService.get<number>('app.port') ?? 4000,
      database: this.connection.readyState === 1 ? 'connected' : 'disconnected',
      databaseName:
        this.connection.db?.databaseName ||
        this.configService.get<string>('database.databaseName') ||
        'bunna_bank_app',
    };
  }
}
