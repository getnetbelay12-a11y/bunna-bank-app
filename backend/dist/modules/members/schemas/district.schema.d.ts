import { HydratedDocument } from 'mongoose';
export type DistrictDocument = HydratedDocument<District>;
export declare class District {
    code: string;
    name: string;
    isActive: boolean;
}
export declare const DistrictSchema: import("mongoose").Schema<District, import("mongoose").Model<District, any, any, any, import("mongoose").Document<unknown, any, District, any, {}> & District & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, District, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<District>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<District> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
