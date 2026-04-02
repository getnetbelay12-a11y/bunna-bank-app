import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DistrictDocument = HydratedDocument<District>;

@Schema({ collection: 'districts', timestamps: true, versionKey: false })
export class District {
  @Prop({ required: true, unique: true, trim: true })
  code!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ default: true, index: true })
  isActive!: boolean;
}

export const DistrictSchema = SchemaFactory.createForClass(District);
