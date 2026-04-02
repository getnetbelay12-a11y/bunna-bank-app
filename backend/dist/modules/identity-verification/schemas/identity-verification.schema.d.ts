import { HydratedDocument, Types } from 'mongoose';
export type IdentityVerificationDocument = HydratedDocument<IdentityVerification>;
export declare class IdentityVerification {
    memberId: Types.ObjectId;
    phoneNumber: string;
    faydaFin?: string;
    faydaAlias?: string;
    qrDataRaw?: string;
    verificationMethod: string;
    verificationStatus: string;
    verifiedAt?: Date;
    verificationReference?: string;
    failureReason?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare const IdentityVerificationSchema: import("mongoose").Schema<IdentityVerification, import("mongoose").Model<IdentityVerification, any, any, any, import("mongoose").Document<unknown, any, IdentityVerification, any, {}> & IdentityVerification & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, IdentityVerification, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<IdentityVerification>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<IdentityVerification> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
