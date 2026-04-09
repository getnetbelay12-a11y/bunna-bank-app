import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type FeePlanDocument = HydratedDocument<FeePlan>;

@Schema({ collection: 'fee_plans', timestamps: true, versionKey: false })
export class FeePlan {
  @Prop({ required: true, trim: true, index: true })
  schoolId!: string;

  @Prop({ required: true, trim: true })
  academicYear!: string;

  @Prop({ required: true, trim: true })
  term!: string;

  @Prop({ required: true, trim: true, index: true })
  grade!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ type: [{ label: String, amount: Number }], default: [] })
  items!: Array<{ label: string; amount: number }>;

  @Prop({ trim: true, default: 'active', index: true })
  status!: string;
}

export const FeePlanSchema = SchemaFactory.createForClass(FeePlan);

FeePlanSchema.index({ schoolId: 1, academicYear: 1, term: 1, grade: 1 });
