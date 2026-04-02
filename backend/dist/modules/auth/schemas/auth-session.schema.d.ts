import { HydratedDocument, Types } from 'mongoose';
export type AuthSessionDocument = HydratedDocument<AuthSession>;
export declare class AuthSession {
    memberId: Types.ObjectId;
    challengeId: string;
    deviceId?: string;
    loginIdentifier: string;
    status: 'pending' | 'verified' | 'expired' | 'logged_out';
    expiresAt: Date;
    verifiedAt?: Date;
    loggedOutAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare const AuthSessionSchema: import("mongoose").Schema<AuthSession, import("mongoose").Model<AuthSession, any, any, any, import("mongoose").Document<unknown, any, AuthSession, any, {}> & AuthSession & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AuthSession, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<AuthSession>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<AuthSession> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
