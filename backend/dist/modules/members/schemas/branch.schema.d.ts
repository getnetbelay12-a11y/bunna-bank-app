import { HydratedDocument, Types } from 'mongoose';
export type BranchDocument = HydratedDocument<Branch>;
export declare class Branch {
    code: string;
    name: string;
    districtId: Types.ObjectId;
    city?: string;
    region?: string;
    isActive: boolean;
}
export declare const BranchSchema: import("mongoose").Schema<Branch, import("mongoose").Model<Branch, any, any, any, import("mongoose").Document<unknown, any, Branch, any, {}> & Branch & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Branch, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Branch>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Branch> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
