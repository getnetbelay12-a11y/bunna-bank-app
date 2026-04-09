import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type InstitutionDocument = HydratedDocument<Institution>;

@Schema({ collection: 'institutions', timestamps: true, versionKey: false })
export class Institution {
  @Prop({ required: true, trim: true, unique: true, index: true })
  code!: string;

  @Prop({ required: true, trim: true, index: true })
  name!: string;

  @Prop({ required: true, trim: true, default: 'school', index: true })
  type!: string;

  @Prop({ trim: true })
  branchName?: string;

  @Prop({ trim: true })
  city?: string;

  @Prop({ trim: true })
  region?: string;

  @Prop({ trim: true, default: 'active', index: true })
  status!: string;
}

export const InstitutionSchema = SchemaFactory.createForClass(Institution);
