import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type LoanDocumentMetadataDocument = HydratedDocument<LoanDocumentMetadata>;

@Schema({ collection: 'loan_documents', timestamps: true, versionKey: false })
export class LoanDocumentMetadata {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Loan', index: true })
  loanId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Member', index: true })
  memberId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  documentType!: string;

  @Prop({ required: true, trim: true })
  originalFileName!: string;

  @Prop({ required: true, trim: true })
  storageKey!: string;

  @Prop({ trim: true })
  mimeType?: string;

  @Prop({ min: 0 })
  sizeBytes?: number;
}

export const LoanDocumentMetadataSchema =
  SchemaFactory.createForClass(LoanDocumentMetadata);

LoanDocumentMetadataSchema.index({ loanId: 1, documentType: 1 });
