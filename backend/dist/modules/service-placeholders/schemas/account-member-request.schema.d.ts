import { HydratedDocument, Types } from 'mongoose';
export type AccountMemberRequestDocument = HydratedDocument<AccountMemberRequest>;
export declare class AccountMemberRequest {
    memberId: Types.ObjectId;
    memberName: string;
    relationship: string;
    phoneNumber: string;
    faydaDocumentUrl: string;
    selfieImageUrl: string;
    selfieVerificationRequired: boolean;
    status: string;
}
export declare const AccountMemberRequestSchema: import("mongoose").Schema<AccountMemberRequest, import("mongoose").Model<AccountMemberRequest, any, any, any, import("mongoose").Document<unknown, any, AccountMemberRequest, any, {}> & AccountMemberRequest & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AccountMemberRequest, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<AccountMemberRequest>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<AccountMemberRequest> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
