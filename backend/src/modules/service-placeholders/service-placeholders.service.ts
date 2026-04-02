import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { AuthenticatedUser } from '../auth/interfaces';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateAtmCardRequestDto } from './dto/create-atm-card-request.dto';
import { CreateAutopayDto } from './dto/create-autopay.dto';
import { SelfieVerifyDto } from './dto/selfie-verify.dto';
import { UpdateAccountLockDto } from './dto/update-account-lock.dto';
import { UpdateAutopayStatusDto } from './dto/update-autopay-status.dto';
import { UpdatePhoneDto } from './dto/update-phone.dto';
import {
  AccountMemberRequest,
  AccountMemberRequestDocument,
} from './schemas/account-member-request.schema';
import { AtmCardRequest, AtmCardRequestDocument } from './schemas/atm-card-request.schema';
import { AutopaySetting, AutopaySettingDocument } from './schemas/autopay-setting.schema';
import {
  MemberSecuritySetting,
  MemberSecuritySettingDocument,
} from './schemas/member-security-setting.schema';
import {
  PhoneUpdateRequest,
  PhoneUpdateRequestDocument,
} from './schemas/phone-update-request.schema';
import {
  SelfieVerification,
  SelfieVerificationDocument,
} from './schemas/selfie-verification.schema';

@Injectable()
export class ServicePlaceholdersService {
  constructor(
    @InjectModel(AutopaySetting.name)
    private readonly autopayModel: Model<AutopaySettingDocument>,
    @InjectModel(MemberSecuritySetting.name)
    private readonly securityModel: Model<MemberSecuritySettingDocument>,
    @InjectModel(AtmCardRequest.name)
    private readonly atmCardRequestModel: Model<AtmCardRequestDocument>,
    @InjectModel(PhoneUpdateRequest.name)
    private readonly phoneUpdateRequestModel: Model<PhoneUpdateRequestDocument>,
    @InjectModel(AccountMemberRequest.name)
    private readonly accountMemberRequestModel: Model<AccountMemberRequestDocument>,
    @InjectModel(SelfieVerification.name)
    private readonly selfieVerificationModel: Model<SelfieVerificationDocument>,
  ) {}

  async createAutopay(currentUser: AuthenticatedUser, dto: CreateAutopayDto) {
    const memberId = this.toObjectId(currentUser.memberId ?? currentUser.sub);
    const serviceType = dto.provider;
    const item = await this.autopayModel.findOneAndUpdate(
      { memberId, serviceType },
      {
        $set: {
          accountId: dto.accountId,
          schedule: dto.schedule,
          enabled: true,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    return {
      feature: 'autopay',
      status: 'saved',
      item: this.toAutopayItem(item),
    };
  }

  async listAutopay(currentUser: AuthenticatedUser) {
    const memberId = this.toObjectId(currentUser.memberId ?? currentUser.sub);
    const items = await this.autopayModel
      .find({ memberId })
      .sort({ serviceType: 1 })
      .lean<AutopaySettingDocument[]>();

    return {
      feature: 'autopay',
      status: 'ok',
      items: items.map((item) => this.toAutopayItem(item)),
    };
  }

  async updateAutopayStatus(
    currentUser: AuthenticatedUser,
    dto: UpdateAutopayStatusDto,
  ) {
    const memberId = this.toObjectId(currentUser.memberId ?? currentUser.sub);
    const filter: Record<string, unknown> = { memberId };

    if (dto.id) {
      filter._id = this.toObjectId(dto.id);
    } else if (dto.provider) {
      filter.serviceType = dto.provider;
    } else {
      throw new BadRequestException('Autopay item id or provider is required.');
    }

    const item = await this.autopayModel.findOneAndUpdate(
      filter,
      { $set: { enabled: dto.enabled } },
      { new: true },
    );

    if (!item) {
      throw new NotFoundException('Autopay setting not found.');
    }

    return {
      feature: 'autopay',
      status: 'updated',
      item: this.toAutopayItem(item),
    };
  }

  async updateAccountLock(
    currentUser: AuthenticatedUser,
    dto: UpdateAccountLockDto,
  ) {
    const memberId = this.toObjectId(currentUser.memberId ?? currentUser.sub);
    const setting = await this.securityModel.findOneAndUpdate(
      { memberId },
      { $set: { accountLockEnabled: dto.enabled } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    return {
      feature: 'account_lock',
      status: 'updated',
      memberId: memberId.toString(),
      accountLockEnabled: setting.accountLockEnabled,
    };
  }

  async getAccountLock(currentUser: AuthenticatedUser) {
    const memberId = this.toObjectId(currentUser.memberId ?? currentUser.sub);
    const setting = await this.securityModel
      .findOne({ memberId })
      .lean<MemberSecuritySettingDocument | null>();

    return {
      feature: 'account_lock',
      status: 'ok',
      memberId: memberId.toString(),
      accountLockEnabled: setting?.accountLockEnabled ?? false,
    };
  }

  async createAtmCardRequest(
    currentUser: AuthenticatedUser,
    dto: CreateAtmCardRequestDto,
  ) {
    const memberId = this.toObjectId(currentUser.memberId ?? currentUser.sub);
    const request = await this.atmCardRequestModel.create({
      memberId,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phoneNumber: dto.phoneNumber,
      region: dto.region,
      city: dto.city,
      preferredBranch: dto.preferredBranch,
      faydaFrontImageUrl: dto.faydaFrontImage,
      faydaBackImageUrl: dto.faydaBackImage,
      selfieImageUrl: dto.selfieImage,
      pin: dto.pin,
      status: 'submitted',
    });

    return {
      feature: 'atm_card_request',
      status: 'submitted',
      workflow: ['submitted', 'branch_review', 'card_production', 'ready_for_pickup'],
      requestId: request._id.toString(),
    };
  }

  async updatePhone(currentUser: AuthenticatedUser, dto: UpdatePhoneDto) {
    const memberId = this.toObjectId(currentUser.memberId ?? currentUser.sub);
    const request = await this.phoneUpdateRequestModel.create({
      memberId,
      currentPhoneNumber: currentUser.phone ?? '',
      requestedPhoneNumber: dto.phoneNumber,
      faydaFrontImageUrl: dto.faydaFrontImage,
      faydaBackImageUrl: dto.faydaBackImage,
      selfieImageUrl: dto.selfieImage,
      faydaVerificationRequired: true,
      selfieVerificationRequired: true,
      status: 'pending_review',
    });

    return {
      feature: 'update_phone',
      status: 'pending_review',
      requestId: request._id.toString(),
      memberId: memberId.toString(),
      selfieVerificationRequired: true,
    };
  }

  async addMember(currentUser: AuthenticatedUser, dto: AddMemberDto) {
    const memberId = this.toObjectId(currentUser.memberId ?? currentUser.sub);
    const request = await this.accountMemberRequestModel.create({
      memberId,
      memberName: dto.memberName,
      relationship: dto.relationship,
      phoneNumber: dto.phoneNumber,
      faydaDocumentUrl: dto.faydaDocument,
      selfieImageUrl: dto.selfieImage,
      selfieVerificationRequired: true,
      status: 'pending_review',
    });

    return {
      feature: 'add_member',
      status: 'pending_review',
      requestId: request._id.toString(),
      memberId: memberId.toString(),
      selfieVerificationRequired: true,
    };
  }

  async selfieVerify(currentUser: AuthenticatedUser, dto: SelfieVerifyDto) {
    const memberId = this.toObjectId(currentUser.memberId ?? currentUser.sub);
    const record = await this.selfieVerificationModel.create({
      memberId,
      imageReference: dto.imageReference,
      purpose: dto.purpose,
      status: 'manual_review_required',
    });

    return {
      feature: 'selfie_verify',
      status: 'manual_review_required',
      requestId: record._id.toString(),
      memberId: memberId.toString(),
      payload: dto,
    };
  }

  private toAutopayItem(item: { _id?: Types.ObjectId; serviceType: string; accountId: string; schedule: string; enabled: boolean }) {
    return {
      id: item._id?.toString(),
      provider: item.serviceType,
      serviceType: item.serviceType,
      accountId: item.accountId,
      schedule: item.schedule,
      enabled: item.enabled,
    };
  }

  private toObjectId(value: string) {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException('Invalid member identifier.');
    }

    return new Types.ObjectId(value);
  }
}
