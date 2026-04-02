import { ConfigService } from '@nestjs/config';
import { Connection } from 'mongoose';

import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns database health details', () => {
    const connection = {
      readyState: 1,
      db: {
        databaseName: 'cbe_bank_app',
      },
    } as unknown as Connection;

    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'app.port') {
          return 4000;
        }

        if (key === 'database.databaseName') {
          return 'cbe_bank_app';
        }

        return undefined;
      }),
    } as unknown as ConfigService;

    const controller = new HealthController(connection, configService);

    expect(controller.getHealth()).toEqual({
      status: 'ok',
      service: 'CBE backend',
      port: 4000,
      database: 'connected',
      databaseName: 'cbe_bank_app',
    });
  });
});
