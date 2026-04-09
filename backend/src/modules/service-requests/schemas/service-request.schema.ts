import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { ServiceRequestStatus, ServiceRequestType } from '../service-request.types';

export type ServiceRequestDocument = HydratedDocument<ServiceRequest>;

@Schema({
  collection: 'service_requests',
  timestamps: true,
  versionKey: false,
})
export class ServiceRequest {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Member', index: true })
  memberId!: Types.ObjectId;

  @Prop({ required: true, trim: true, index: true })
  customerId!: string;

  @Prop({ required: true, trim: true })
  memberName!: string;

  @Prop({ trim: true, index: true })
  phoneNumber?: string;

  @Prop({ type: Types.ObjectId, ref: 'Branch', index: true })
  branchId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'District', index: true })
  districtId?: Types.ObjectId;

  @Prop({ trim: true })
  branchName?: string;

  @Prop({ required: true, enum: ServiceRequestType, index: true })
  type!: ServiceRequestType;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, trim: true })
  description!: string;

  @Prop({ type: Object, default: {} })
  payload!: Record<string, unknown>;

  @Prop({ type: [String], default: [] })
  attachments!: string[];

  @Prop({
    required: true,
    enum: ServiceRequestStatus,
    default: ServiceRequestStatus.SUBMITTED,
    index: true,
  })
  status!: ServiceRequestStatus;

  @Prop({ trim: true })
  latestNote?: string;

  @Prop({ type: Types.ObjectId, ref: 'Staff' })
  assignedToStaffId?: Types.ObjectId;

  @Prop({ trim: true })
  assignedToStaffName?: string;

  @Prop()
  cancelledAt?: Date;

  @Prop()
  completedAt?: Date;

  createdAt?: Date;

  updatedAt?: Date;
}

export const ServiceRequestSchema = SchemaFactory.createForClass(ServiceRequest);
