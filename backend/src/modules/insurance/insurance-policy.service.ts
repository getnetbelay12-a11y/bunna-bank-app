import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { InsurancePolicyStatus } from '../../common/enums';
import { InsurancePolicy, InsurancePolicyDocument } from './schemas/insurance-policy.schema';

@Injectable()
export class InsurancePolicyService {
  constructor(
    @InjectModel(InsurancePolicy.name)
    private readonly insurancePolicyModel: Model<InsurancePolicyDocument>,
  ) {}

  async listPoliciesForMembers(memberIds: Types.ObjectId[]) {
    if (memberIds.length === 0) {
      return [];
    }

    return this.insurancePolicyModel
      .find({ memberId: { $in: memberIds } })
      .sort({ endDate: 1 })
      .lean<InsurancePolicyDocument[]>();
  }

  async markReminderSent(policyId: Types.ObjectId) {
    await this.insurancePolicyModel.updateOne(
      { _id: policyId },
      { $set: { renewalReminderSent: true } },
    );
  }

  resolvePolicyStatus(endDate: Date, now = new Date()) {
    if (endDate.getTime() < now.getTime()) {
      return InsurancePolicyStatus.EXPIRED;
    }

    const dayDiff = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (dayDiff <= 30) {
      return InsurancePolicyStatus.EXPIRING;
    }

    return InsurancePolicyStatus.ACTIVE;
  }
}
