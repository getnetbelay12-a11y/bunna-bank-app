import { HydratedDocument, Types } from 'mongoose';
export type MemberProfileDocument = HydratedDocument<MemberProfileEntity>;
export declare class MemberProfileEntity {
    memberId: Types.ObjectId;
    dateOfBirth: Date;
    branchId: Types.ObjectId;
    districtId: Types.ObjectId;
    membershipStatus: string;
    identityVerificationStatus: string;
    onboardingReviewStatus: string;
    onboardingReviewNote?: string;
    onboardingReviewedBy?: string;
    onboardingLastReviewedAt?: Date;
    consentAccepted: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare const MemberProfileSchema: import("mongoose").Schema<MemberProfileEntity, import("mongoose").Model<MemberProfileEntity, any, any, any, import("mongoose").Document<unknown, any, MemberProfileEntity, any, {}> & MemberProfileEntity & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, MemberProfileEntity, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<MemberProfileEntity>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<MemberProfileEntity> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
