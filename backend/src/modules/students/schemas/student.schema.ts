import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type StudentDocument = HydratedDocument<Student>;

@Schema({ collection: 'students', timestamps: true, versionKey: false })
export class Student {
  @Prop({ required: true, trim: true, index: true })
  schoolId!: string;

  @Prop({ required: true, trim: true, unique: true, index: true })
  studentId!: string;

  @Prop({ required: true, trim: true, index: true })
  fullName!: string;

  @Prop({ trim: true, index: true })
  grade?: string;

  @Prop({ trim: true, index: true })
  section?: string;

  @Prop({ trim: true })
  guardianName?: string;

  @Prop({ trim: true })
  guardianPhone?: string;

  @Prop({ trim: true, index: true })
  parentAccountNumber?: string;

  @Prop({ trim: true, default: 'active', index: true })
  status!: string;
}

export const StudentSchema = SchemaFactory.createForClass(Student);
StudentSchema.index({ schoolId: 1, grade: 1, section: 1 });
