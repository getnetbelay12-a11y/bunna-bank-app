import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SecurityReviewDailySnapshotDocument =
  HydratedDocument<SecurityReviewDailySnapshot>;

@Schema({
  collection: 'security_review_daily_snapshots',
  timestamps: true,
  versionKey: false,
})
export class SecurityReviewDailySnapshot {
  @Prop({ required: true })
  periodStart!: Date;

  @Prop({ required: true, default: 0 })
  openCount!: number;

  @Prop({ required: true, default: 0 })
  breachedCount!: number;

  @Prop({ required: true, default: 0 })
  dueSoonCount!: number;

  @Prop({ required: true, default: 0 })
  stalledCount!: number;

  @Prop({ required: true, default: 0 })
  takeoverCount!: number;

  @Prop({ required: true, default: 0 })
  stalledEventsCount!: number;

  @Prop({ required: true, default: 0 })
  takeoverEventsCount!: number;
}

export const SecurityReviewDailySnapshotSchema =
  SchemaFactory.createForClass(SecurityReviewDailySnapshot);

SecurityReviewDailySnapshotSchema.index({ periodStart: 1 }, { unique: true });
