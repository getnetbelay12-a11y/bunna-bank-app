import { HydratedDocument, Types } from 'mongoose';
export type AtmCardRequestDocument = HydratedDocument<AtmCardRequest>;
export declare class AtmCardRequest {
    memberId: Types.ObjectId;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    region: string;
    city: string;
    preferredBranch: string;
    faydaFrontImageUrl: string;
    faydaBackImageUrl: string;
    selfieImageUrl?: string;
    pin: string;
    status: string;
}
export declare const AtmCardRequestSchema: import("mongoose").Schema<AtmCardRequest, import("mongoose").Model<AtmCardRequest, any, any, any, import("mongoose").Document<unknown, any, AtmCardRequest, any, {}> & AtmCardRequest & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AtmCardRequest, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<AtmCardRequest>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<AtmCardRequest> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
