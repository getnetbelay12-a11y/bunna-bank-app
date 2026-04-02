import { HydratedDocument, Types } from 'mongoose';
export type PhoneUpdateRequestDocument = HydratedDocument<PhoneUpdateRequest>;
export declare class PhoneUpdateRequest {
    memberId: Types.ObjectId;
    currentPhoneNumber: string;
    requestedPhoneNumber: string;
    faydaFrontImageUrl: string;
    faydaBackImageUrl: string;
    selfieImageUrl: string;
    faydaVerificationRequired: boolean;
    selfieVerificationRequired: boolean;
    status: string;
}
export declare const PhoneUpdateRequestSchema: import("mongoose").Schema<PhoneUpdateRequest, import("mongoose").Model<PhoneUpdateRequest, any, any, any, import("mongoose").Document<unknown, any, PhoneUpdateRequest, any, {}> & PhoneUpdateRequest & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, PhoneUpdateRequest, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<PhoneUpdateRequest>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<PhoneUpdateRequest> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
