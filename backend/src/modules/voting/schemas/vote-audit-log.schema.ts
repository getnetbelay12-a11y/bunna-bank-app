import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

import { UserRole } from '../../../common/enums';

export type VoteAuditLogDocument = HydratedDocument<VoteAuditLog>;

@Schema({ collection: 'vote_audit_logs', timestamps: true, versionKey: false })
export class VoteAuditLog {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Vote', index: true })
  voteId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Member', index: true })
  memberId!: Types.ObjectId;

  @Prop({ required: true, trim: true, index: true })
  action!: string;

  @Prop({ type: Types.ObjectId, index: true })
  actorId?: Types.ObjectId;

  @Prop({ enum: UserRole })
  actorRole?: UserRole;

  @Prop({ type: MongooseSchema.Types.Mixed })
  metadata?: Record<string, unknown>;
}

export const VoteAuditLogSchema = SchemaFactory.createForClass(VoteAuditLog);

VoteAuditLogSchema.index({ voteId: 1, createdAt: -1 });
