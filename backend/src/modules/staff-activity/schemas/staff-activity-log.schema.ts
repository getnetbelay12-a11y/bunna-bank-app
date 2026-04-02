import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { ActivityType } from '../../../common/enums';

export type StaffActivityLogDocument = HydratedDocument<StaffActivityLog>;

@Schema({
  collection: 'staff_activity_logs',
  timestamps: true,
  versionKey: false,
})
export class StaffActivityLog {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Staff', index: true })
  staffId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Member', index: true })
  memberId?: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Branch', index: true })
  branchId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'District', index: true })
  districtId!: Types.ObjectId;

  @Prop({ required: true, enum: ActivityType, index: true })
  activityType!: ActivityType;

  @Prop({ trim: true })
  referenceType?: string;

  @Prop({ type: Types.ObjectId, index: true })
  referenceId?: Types.ObjectId;

  @Prop({ min: 0, default: 0 })
  amount!: number;
}

export const StaffActivityLogSchema =
  SchemaFactory.createForClass(StaffActivityLog);

StaffActivityLogSchema.index({ staffId: 1, createdAt: -1 });
StaffActivityLogSchema.index({ branchId: 1, activityType: 1, createdAt: -1 });
