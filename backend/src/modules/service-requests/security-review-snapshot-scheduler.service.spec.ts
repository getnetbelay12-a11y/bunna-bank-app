import { ConfigService } from '@nestjs/config';

import { SecurityReviewSnapshotSchedulerService } from './security-review-snapshot-scheduler.service';
import { ServiceRequestsService } from './service-requests.service';

describe('SecurityReviewSnapshotSchedulerService', () => {
  let reportingJobStateModel: any;
  let configService: jest.Mocked<ConfigService>;
  let serviceRequestsService: jest.Mocked<ServiceRequestsService>;
  let scheduler: SecurityReviewSnapshotSchedulerService;

  beforeEach(() => {
    reportingJobStateModel = {
      findOneAndUpdate: jest.fn(),
      updateOne: jest.fn(),
    };
    configService = {
      get: jest.fn((key: string, defaultValue?: number) => {
        if (key === 'REPORTING_SNAPSHOT_LOOKBACK_DAYS') {
          return 14;
        }

        if (key === 'REPORTING_SNAPSHOT_LOCK_MINUTES') {
          return 10;
        }

        return defaultValue;
      }),
    } as never;
    serviceRequestsService = {
      materializeRecentSecurityReviewSnapshots: jest.fn(),
    } as never;

    scheduler = new SecurityReviewSnapshotSchedulerService(
      reportingJobStateModel,
      configService,
      serviceRequestsService,
    );
  });

  it('materializes snapshots and releases the shared lock when acquired', async () => {
    reportingJobStateModel.findOneAndUpdate.mockImplementation(
      async (_filter: unknown, update: { $set: { lockOwnerId: string } }) => ({
        lockOwnerId: update.$set.lockOwnerId,
      }),
    );
    reportingJobStateModel.updateOne.mockResolvedValue({ acknowledged: true });

    await scheduler.handleDailyMaterialization();

    expect(serviceRequestsService.materializeRecentSecurityReviewSnapshots).toHaveBeenCalledWith(
      14,
    );
    expect(reportingJobStateModel.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({
        jobKey: 'security_review_daily_snapshots',
      }),
      expect.objectContaining({
        $set: expect.objectContaining({
          lastError: null,
        }),
      }),
    );
  });

  it('skips materialization when another instance already holds the lock', async () => {
    reportingJobStateModel.findOneAndUpdate.mockResolvedValue({
      lockOwnerId: 'another-instance',
    });

    await scheduler.handleDailyMaterialization();

    expect(serviceRequestsService.materializeRecentSecurityReviewSnapshots).not.toHaveBeenCalled();
    expect(reportingJobStateModel.updateOne).not.toHaveBeenCalled();
  });
});
