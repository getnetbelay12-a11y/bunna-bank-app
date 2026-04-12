import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ReportingJobStateDocument = HydratedDocument<ReportingJobState>;

@Schema({
  collection: 'reporting_job_states',
  timestamps: true,
  versionKey: false,
})
export class ReportingJobState {
  @Prop({ required: true, unique: true })
  jobKey!: string;

  @Prop()
  lockOwnerId?: string;

  @Prop()
  lockedUntil?: Date;

  @Prop()
  lastStartedAt?: Date;

  @Prop()
  lastCompletedAt?: Date;

  @Prop()
  lastMaterializedThrough?: Date;

  @Prop()
  lastError?: string;
}

export const ReportingJobStateSchema =
  SchemaFactory.createForClass(ReportingJobState);
