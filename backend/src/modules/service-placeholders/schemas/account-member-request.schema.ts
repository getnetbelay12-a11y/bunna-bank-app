import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AccountMemberRequestDocument = HydratedDocument<AccountMemberRequest>;

@Schema({
  collection: 'account_member_requests',
  timestamps: true,
  versionKey: false,
})
export class AccountMemberRequest {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Member', index: true })
  memberId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  memberName!: string;

  @Prop({ required: true, trim: true })
  relationship!: string;

  @Prop({ required: true, trim: true, index: true })
  phoneNumber!: string;

  @Prop({ required: true, trim: true })
  faydaDocumentUrl!: string;

  @Prop({ required: true, trim: true })
  selfieImageUrl!: string;

  @Prop({ default: true })
  selfieVerificationRequired!: boolean;

  @Prop({ default: 'pending_review', index: true })
  status!: string;
}

export const AccountMemberRequestSchema =
  SchemaFactory.createForClass(AccountMemberRequest);
