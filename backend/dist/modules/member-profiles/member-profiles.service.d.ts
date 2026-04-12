import { Model, Types } from 'mongoose';
import { MemberProfileDocument, MemberProfileEntity } from './schemas/member-profile.schema';
export declare class MemberProfilesService {
    private readonly memberProfileModel;
    constructor(memberProfileModel: Model<MemberProfileDocument>);
    create(dto: {
        memberId: string;
        dateOfBirth: Date;
        branchId: string;
        districtId: string;
        consentAccepted: boolean;
        membershipStatus?: string;
        identityVerificationStatus?: string;
        onboardingReviewStatus?: string;
    }): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, MemberProfileEntity, {}, {}> & MemberProfileEntity & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, {}, {}> & import("mongoose").Document<unknown, {}, MemberProfileEntity, {}, {}> & MemberProfileEntity & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & Required<{
        _id: Types.ObjectId;
    }>>;
    findByMemberId(memberId: string): Promise<(import("mongoose").Document<unknown, {}, MemberProfileEntity, {}, {}> & MemberProfileEntity & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }) | null>;
    updateStatuses(memberId: string, input: {
        membershipStatus?: string;
        identityVerificationStatus?: string;
        onboardingReviewStatus?: string;
        onboardingReviewNote?: string;
        onboardingReviewedBy?: string;
        onboardingLastReviewedAt?: Date;
    }): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, MemberProfileEntity, {}, {}> & MemberProfileEntity & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, {}, {}> & import("mongoose").Document<unknown, {}, MemberProfileEntity, {}, {}> & MemberProfileEntity & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & Required<{
        _id: Types.ObjectId;
    }>) | null>;
}
