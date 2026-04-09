import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type InvoiceDocument = HydratedDocument<Invoice>;

@Schema({ collection: 'invoices', timestamps: true, versionKey: false })
export class Invoice {
  @Prop({ required: true, trim: true, unique: true, index: true })
  invoiceNo!: string;

  @Prop({ required: true, trim: true, index: true })
  schoolId!: string;

  @Prop({ required: true, trim: true, index: true })
  studentId!: string;

  @Prop({ required: true, min: 0 })
  total!: number;

  @Prop({ required: true, min: 0, default: 0 })
  paid!: number;

  @Prop({ required: true, min: 0 })
  balance!: number;

  @Prop({ trim: true, default: 'open', index: true })
  status!: string;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);
InvoiceSchema.index({ schoolId: 1, status: 1 });
