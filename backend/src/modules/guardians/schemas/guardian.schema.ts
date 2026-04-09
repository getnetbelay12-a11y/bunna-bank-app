import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type GuardianDocument = HydratedDocument<Guardian>;

@Schema({ collection: 'guardians', timestamps: true, versionKey: false })
export class Guardian {
  @Prop({ required: true, trim: true, unique: true, index: true })
  guardianId!: string;

  @Prop({ required: true, trim: true, index: true })
  studentId!: string;

  @Prop({ required: true, trim: true })
  fullName!: string;

  @Prop({ required: true, trim: true })
  phone!: string;

  @Prop({ trim: true })
  relationship!: string;

  @Prop({ trim: true, default: 'linked', index: true })
  status!: string;
}

export const GuardianSchema = SchemaFactory.createForClass(Guardian);
