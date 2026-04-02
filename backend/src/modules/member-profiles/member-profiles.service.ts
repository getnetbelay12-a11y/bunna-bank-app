import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  MemberProfileDocument,
  MemberProfileEntity,
} from './schemas/member-profile.schema';

@Injectable()
export class MemberProfilesService {
  constructor(
    @InjectModel(MemberProfileEntity.name)
    private readonly memberProfileModel: Model<MemberProfileDocument>,
  ) {}

  async create(dto: {
    memberId: string;
    dateOfBirth: Date;
    branchId: string;
    districtId: string;
    consentAccepted: boolean;
    membershipStatus?: string;
    identityVerificationStatus?: string;
  }) {
    return this.memberProfileModel.create({
      memberId: new Types.ObjectId(dto.memberId),
      dateOfBirth: dto.dateOfBirth,
      branchId: new Types.ObjectId(dto.branchId),
      districtId: new Types.ObjectId(dto.districtId),
      consentAccepted: dto.consentAccepted,
      membershipStatus: dto.membershipStatus ?? 'pending_verification',
      identityVerificationStatus: dto.identityVerificationStatus ?? 'not_started',
    });
  }

  async findByMemberId(memberId: string) {
    return this.memberProfileModel
      .findOne({ memberId: new Types.ObjectId(memberId) })
      .lean<MemberProfileDocument | null>();
  }

  async updateStatuses(
    memberId: string,
    input: {
      membershipStatus?: string;
      identityVerificationStatus?: string;
    },
  ) {
    return this.memberProfileModel.findOneAndUpdate(
      { memberId: new Types.ObjectId(memberId) },
      { $set: input },
      { new: true, upsert: false },
    );
  }
}
