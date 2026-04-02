import { HydratedDocument, Types } from 'mongoose';
export type LoanDocumentMetadataDocument = HydratedDocument<LoanDocumentMetadata>;
export declare class LoanDocumentMetadata {
    loanId: Types.ObjectId;
    memberId: Types.ObjectId;
    documentType: string;
    originalFileName: string;
    storageKey: string;
    mimeType?: string;
    sizeBytes?: number;
}
export declare const LoanDocumentMetadataSchema: import("mongoose").Schema<LoanDocumentMetadata, import("mongoose").Model<LoanDocumentMetadata, any, any, any, import("mongoose").Document<unknown, any, LoanDocumentMetadata, any, {}> & LoanDocumentMetadata & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, LoanDocumentMetadata, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<LoanDocumentMetadata>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<LoanDocumentMetadata> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
