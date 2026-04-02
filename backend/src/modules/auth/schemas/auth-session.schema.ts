import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AuthSessionDocument = HydratedDocument<AuthSession>;

@Schema({ collection: 'auth_sessions', timestamps: true, versionKey: false })
export class AuthSession {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Member', index: true })
  memberId!: Types.ObjectId;

  @Prop({ required: true, trim: true, unique: true, index: true })
  challengeId!: string;

  @Prop({ trim: true, index: true })
  deviceId?: string;

  @Prop({ required: true, trim: true })
  loginIdentifier!: string;

  @Prop({ required: true, enum: ['pending', 'verified', 'expired', 'logged_out'], index: true })
  status!: 'pending' | 'verified' | 'expired' | 'logged_out';

  @Prop({ required: true, index: true })
  expiresAt!: Date;

  @Prop()
  verifiedAt?: Date;

  @Prop()
  loggedOutAt?: Date;

  createdAt?: Date;

  updatedAt?: Date;
}

export const AuthSessionSchema = SchemaFactory.createForClass(AuthSession);

AuthSessionSchema.index({ memberId: 1, createdAt: -1 });
