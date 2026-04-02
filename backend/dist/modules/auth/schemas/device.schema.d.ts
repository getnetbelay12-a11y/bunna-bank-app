import { HydratedDocument, Types } from 'mongoose';
export type DeviceDocument = HydratedDocument<Device>;
export declare class Device {
    memberId: Types.ObjectId;
    deviceId: string;
    rememberDevice: boolean;
    biometricEnabled: boolean;
    lastLoginAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare const DeviceSchema: import("mongoose").Schema<Device, import("mongoose").Model<Device, any, any, any, import("mongoose").Document<unknown, any, Device, any, {}> & Device & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Device, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Device>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Device> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
