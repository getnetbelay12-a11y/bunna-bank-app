import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MemberSecuritySettingDocument = HydratedDocument<MemberSecuritySetting>;

@Schema({
  collection: 'member_security_settings',
  timestamps: true,
  versionKey: false,
})
export class MemberSecuritySetting {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Member', unique: true, index: true })
  memberId!: Types.ObjectId;

  @Prop({ default: false })
  accountLockEnabled!: boolean;
}

export const MemberSecuritySettingSchema =
  SchemaFactory.createForClass(MemberSecuritySetting);
