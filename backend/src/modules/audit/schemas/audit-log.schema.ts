import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

import { UserRole } from '../../../common/enums';

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({ collection: 'audit_logs', timestamps: true, versionKey: false })
export class AuditLog {
  @Prop({ required: true, type: Types.ObjectId, index: true })
  actorId!: Types.ObjectId;

  @Prop({ required: true, enum: UserRole, index: true })
  actorRole!: UserRole;

  @Prop({ required: true, trim: true, index: true })
  actionType!: string;

  @Prop({ required: true, trim: true, index: true })
  entityType!: string;

  @Prop({ required: true, type: Types.ObjectId, index: true })
  entityId!: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.Mixed })
  before?: Record<string, unknown> | null;

  @Prop({ type: MongooseSchema.Types.Mixed })
  after?: Record<string, unknown> | null;

  createdAt?: Date;

  updatedAt?: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

AuditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
AuditLogSchema.index({ actorId: 1, createdAt: -1 });
