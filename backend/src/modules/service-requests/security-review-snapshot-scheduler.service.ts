import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { Model } from 'mongoose';

import {
  ReportingJobState,
  ReportingJobStateDocument,
} from './schemas/reporting-job-state.schema';
import { ServiceRequestsService } from './service-requests.service';

@Injectable()
export class SecurityReviewSnapshotSchedulerService implements OnModuleInit {
  private static readonly JOB_KEY = 'security_review_daily_snapshots';
  private readonly logger = new Logger(SecurityReviewSnapshotSchedulerService.name);
  private readonly ownerId = `${process.pid}-${Math.random().toString(36).slice(2, 10)}`;

  constructor(
    @InjectModel(ReportingJobState.name)
    private readonly reportingJobStateModel: Model<ReportingJobStateDocument>,
    private readonly configService: ConfigService,
    private readonly serviceRequestsService: ServiceRequestsService,
  ) {}

  async onModuleInit() {
    await this.materialize('startup catch-up');
  }

  @Cron('15 0 * * *', { timeZone: 'UTC' })
  async handleDailyMaterialization() {
    await this.materialize('daily schedule');
  }

  private async materialize(trigger: string) {
    const acquiredLock = await this.acquireLock();
    if (!acquiredLock) {
      this.logger.log(
        `Skipped security review snapshot materialization via ${trigger}; another instance holds the job lock.`,
      );
      return;
    }

    try {
      const lookbackDays = this.configService.get<number>(
        'REPORTING_SNAPSHOT_LOOKBACK_DAYS',
        14,
      );
      const materializedThrough = new Date();
      materializedThrough.setUTCHours(0, 0, 0, 0);

      await this.serviceRequestsService.materializeRecentSecurityReviewSnapshots(lookbackDays);
      await this.releaseLock({
        lastCompletedAt: new Date(),
        lastError: null,
        lastMaterializedThrough: materializedThrough,
      });
      this.logger.log(`Security review snapshots materialized via ${trigger}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      await this.releaseLock({ lastError: message });
      this.logger.error(
        `Security review snapshot materialization failed via ${trigger}: ${message}`,
      );
    }
  }

  private async acquireLock() {
    const now = new Date();
    const lockedUntil = new Date(
      now.getTime() +
        this.configService.get<number>('REPORTING_SNAPSHOT_LOCK_MINUTES', 10) * 60 * 1000,
    );

    const state = await this.reportingJobStateModel.findOneAndUpdate(
      {
        jobKey: SecurityReviewSnapshotSchedulerService.JOB_KEY,
        $or: [{ lockedUntil: { $exists: false } }, { lockedUntil: { $lte: now } }],
      },
      {
        $set: {
          jobKey: SecurityReviewSnapshotSchedulerService.JOB_KEY,
          lockOwnerId: this.ownerId,
          lockedUntil,
          lastStartedAt: now,
          lastError: null,
        },
      },
      {
        upsert: true,
        new: true,
      },
    );

    return state?.lockOwnerId === this.ownerId;
  }

  private async releaseLock(input: {
    lastCompletedAt?: Date;
    lastMaterializedThrough?: Date;
    lastError: string | null;
  }) {
    await this.reportingJobStateModel.updateOne(
      {
        jobKey: SecurityReviewSnapshotSchedulerService.JOB_KEY,
        lockOwnerId: this.ownerId,
      },
      {
        $set: {
          lockedUntil: new Date(0),
          ...(input.lastCompletedAt ? { lastCompletedAt: input.lastCompletedAt } : {}),
          ...(input.lastMaterializedThrough
            ? { lastMaterializedThrough: input.lastMaterializedThrough }
            : {}),
          lastError: input.lastError,
        },
      },
    );
  }
}
