import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { ServiceRequestStatus } from '../service-request.types';

export type ServiceRequestEventDocument = HydratedDocument<ServiceRequestEvent>;

@Schema({
  collection: 'service_request_events',
  timestamps: true,
  versionKey: false,
})
export class ServiceRequestEvent {
  @Prop({ required: true, type: Types.ObjectId, ref: 'ServiceRequest', index: true })
  serviceRequestId!: Types.ObjectId;

  @Prop({ required: true, trim: true, index: true })
  actorType!: 'member' | 'staff' | 'system';

  @Prop({ trim: true })
  actorId?: string;

  @Prop({ trim: true })
  actorName?: string;

  @Prop({ required: true, trim: true })
  eventType!: 'created' | 'status_updated' | 'cancelled';

  @Prop({ enum: ServiceRequestStatus })
  fromStatus?: ServiceRequestStatus;

  @Prop({ enum: ServiceRequestStatus })
  toStatus?: ServiceRequestStatus;

  @Prop({ trim: true })
  note?: string;

  createdAt?: Date;

  updatedAt?: Date;
}

export const ServiceRequestEventSchema =
  SchemaFactory.createForClass(ServiceRequestEvent);
