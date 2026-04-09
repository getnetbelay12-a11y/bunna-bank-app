import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EnrollmentDocument = HydratedDocument<Enrollment>;

@Schema({ collection: 'enrollments', timestamps: true, versionKey: false })
export class Enrollment {
  @Prop({ required: true, trim: true, unique: true, index: true })
  enrollmentId!: string;

  @Prop({ required: true, trim: true, index: true })
  schoolId!: string;

  @Prop({ required: true, trim: true, index: true })
  studentId!: string;

  @Prop({ required: true, trim: true })
  academicYear!: string;

  @Prop({ required: true, trim: true, index: true })
  grade!: string;

  @Prop({ required: true, trim: true, index: true })
  section!: string;

  @Prop({ trim: true })
  rollNumber?: string;

  @Prop({ trim: true, default: 'active', index: true })
  status!: string;
}

export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);
EnrollmentSchema.index({ schoolId: 1, academicYear: 1, grade: 1, section: 1 });
