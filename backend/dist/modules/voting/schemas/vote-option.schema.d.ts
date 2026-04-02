import { HydratedDocument, Types } from 'mongoose';
export type VoteOptionDocument = HydratedDocument<VoteOption>;
export declare class VoteOption {
    voteId: Types.ObjectId;
    name: string;
    description?: string;
    displayOrder: number;
}
export declare const VoteOptionSchema: import("mongoose").Schema<VoteOption, import("mongoose").Model<VoteOption, any, any, any, import("mongoose").Document<unknown, any, VoteOption, any, {}> & VoteOption & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, VoteOption, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<VoteOption>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<VoteOption> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
