import { Model, Types } from 'mongoose';
import { InsurancePolicyStatus } from '../../common/enums';
import { InsurancePolicy, InsurancePolicyDocument } from './schemas/insurance-policy.schema';
export declare class InsurancePolicyService {
    private readonly insurancePolicyModel;
    constructor(insurancePolicyModel: Model<InsurancePolicyDocument>);
    listPoliciesForMembers(memberIds: Types.ObjectId[]): Promise<(import("mongoose").Document<unknown, {}, InsurancePolicy, {}, {}> & InsurancePolicy & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    })[]>;
    markReminderSent(policyId: Types.ObjectId): Promise<void>;
    resolvePolicyStatus(endDate: Date, now?: Date): InsurancePolicyStatus.ACTIVE | InsurancePolicyStatus.EXPIRING | InsurancePolicyStatus.EXPIRED;
}
