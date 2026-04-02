import { HydratedDocument, Types } from 'mongoose';
export type SelfieVerificationDocument = HydratedDocument<SelfieVerification>;
export declare class SelfieVerification {
    memberId: Types.ObjectId;
    imageReference: string;
    purpose: string;
    status: string;
}
export declare const SelfieVerificationSchema: import("mongoose").Schema<SelfieVerification, import("mongoose").Model<SelfieVerification, any, any, any, import("mongoose").Document<unknown, any, SelfieVerification, any, {}> & SelfieVerification & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, SelfieVerification, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<SelfieVerification>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<SelfieVerification> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
