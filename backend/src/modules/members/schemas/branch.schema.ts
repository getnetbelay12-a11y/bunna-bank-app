import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BranchDocument = HydratedDocument<Branch>;

@Schema({ collection: 'branches', timestamps: true, versionKey: false })
export class Branch {
  @Prop({ required: true, unique: true, trim: true })
  code!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'District', index: true })
  districtId!: Types.ObjectId;

  @Prop({ trim: true })
  city?: string;

  @Prop({ trim: true, default: 'Amhara', index: true })
  region?: string;

  @Prop({ default: true, index: true })
  isActive!: boolean;
}

export const BranchSchema = SchemaFactory.createForClass(Branch);

BranchSchema.index({ districtId: 1, name: 1 });
BranchSchema.index({ region: 1, city: 1, name: 1 });
