import { HydratedDocument, Types } from 'mongoose';
import { VoteStatus } from '../../../common/enums';
export type VoteDocument = HydratedDocument<Vote>;
export declare class Vote {
    title: string;
    description?: string;
    type: string;
    status: VoteStatus;
    startDate: Date;
    endDate: Date;
    createdBy: Types.ObjectId;
    resultsPublishedAt?: Date;
}
export declare const VoteSchema: import("mongoose").Schema<Vote, import("mongoose").Model<Vote, any, any, any, import("mongoose").Document<unknown, any, Vote, any, {}> & Vote & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Vote, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Vote>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Vote> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
