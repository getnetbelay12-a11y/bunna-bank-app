import { HydratedDocument, Types } from 'mongoose';
export type VoteResponseDocument = HydratedDocument<VoteResponse>;
export declare class VoteResponse {
    voteId: Types.ObjectId;
    memberId: Types.ObjectId;
    optionId: Types.ObjectId;
    branchId: Types.ObjectId;
    districtId: Types.ObjectId;
    encryptedBallot: string;
    otpVerifiedAt?: Date;
}
export declare const VoteResponseSchema: import("mongoose").Schema<VoteResponse, import("mongoose").Model<VoteResponse, any, any, any, import("mongoose").Document<unknown, any, VoteResponse, any, {}> & VoteResponse & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, VoteResponse, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<VoteResponse>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<VoteResponse> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
