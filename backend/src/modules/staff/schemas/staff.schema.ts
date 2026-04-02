import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { UserRole } from '../../../common/enums';

export type StaffDocument = HydratedDocument<Staff>;

@Schema({ collection: 'staff', timestamps: true, versionKey: false })
export class Staff {
  @Prop({ required: true, unique: true, trim: true })
  staffNumber!: string;

  @Prop({ required: true, trim: true })
  fullName!: string;

  @Prop({ required: true, unique: true, trim: true })
  identifier!: string;

  @Prop({ required: true, trim: true })
  phone!: string;

  @Prop({ trim: true })
  email?: string;

  @Prop({
    required: true,
    enum: [
      UserRole.SUPPORT_AGENT,
      UserRole.LOAN_OFFICER,
      UserRole.BRANCH_MANAGER,
      UserRole.DISTRICT_OFFICER,
      UserRole.DISTRICT_MANAGER,
      UserRole.HEAD_OFFICE_OFFICER,
      UserRole.HEAD_OFFICE_MANAGER,
      UserRole.ADMIN,
    ],
    index: true,
  })
  role!: UserRole;

  @Prop({ type: Types.ObjectId, ref: 'Branch', index: true })
  branchId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'District', index: true })
  districtId?: Types.ObjectId;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop({ default: true, index: true })
  isActive!: boolean;
}

export const StaffSchema = SchemaFactory.createForClass(Staff);

StaffSchema.index({ role: 1, branchId: 1 });
StaffSchema.index({ role: 1, districtId: 1 });
