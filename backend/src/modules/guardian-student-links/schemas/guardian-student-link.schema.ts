import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type GuardianStudentLinkDocument = HydratedDocument<GuardianStudentLinkEntity>;

@Schema({
  collection: 'guardian_student_links',
  timestamps: true,
  versionKey: false,
})
export class GuardianStudentLinkEntity {
  @Prop({ required: true, trim: true, unique: true, index: true })
  linkId!: string;

  @Prop({ required: true, trim: true, index: true })
  studentId!: string;

  @Prop({ required: true, trim: true, index: true })
  guardianId!: string;

  @Prop({ required: true, trim: true, index: true })
  memberCustomerId!: string;

  @Prop({ required: true, trim: true })
  relationship!: string;

  @Prop({
    required: true,
    enum: ['active', 'inactive', 'pending_verification'],
    default: 'active',
    index: true,
  })
  status!: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const GuardianStudentLinkSchema =
  SchemaFactory.createForClass(GuardianStudentLinkEntity);

GuardianStudentLinkSchema.index({ memberCustomerId: 1, status: 1 });
GuardianStudentLinkSchema.index({ studentId: 1, guardianId: 1 }, { unique: true });
