import { createHash } from 'crypto';

import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { NotificationType } from '../../common/enums';
import { AuthenticatedUser } from '../auth/interfaces';
import { AuditService } from '../audit/audit.service';
import { Member, MemberDocument } from '../members/schemas/member.schema';
import { NotificationsService } from '../notifications/notifications.service';
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
    @InjectModel(Member.name)
    private readonly memberModel: Model<MemberDocument>,
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
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
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
    await this.loadEligibleMember(currentUser, {
      requireVerifiedKyc: false,
      ignoreAccountLock: !dto.enabled,
    });
    const setting = await this.securityModel.findOneAndUpdate(
      { memberId },
      { $set: { accountLockEnabled: dto.enabled } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    await this.auditService.log({
      actorId: memberId.toString(),
      actorRole: currentUser.role,
      actionType: dto.enabled ? 'account_lock_enabled' : 'account_lock_disabled',
      entityType: 'member_security_setting',
      entityId: setting._id.toString(),
      before: null,
      after: {
        memberId: memberId.toString(),
        accountLockEnabled: setting.accountLockEnabled,
      },
    });

    await this.notificationsService.createNotification({
      userType: 'member',
      userId: memberId.toString(),
      userRole: currentUser.role,
      type: dto.enabled
        ? NotificationType.ACCOUNT_LOCKED
        : NotificationType.ACCOUNT_UNLOCKED,
      title: dto.enabled ? 'Account lock enabled' : 'Account lock disabled',
      message: dto.enabled
        ? 'High-risk actions are now blocked until you unlock the account again.'
        : 'High-risk actions are available again on your mobile banking profile.',
      entityType: 'security',
      entityId: setting._id.toString(),
      actionLabel: 'Open security',
      priority: 'high',
      deepLink: '/profile/security',
    });

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
    const member = await this.loadEligibleMember(currentUser);
    this.ensureProfileMatchesMember(member, dto.firstName, dto.lastName, dto.phoneNumber);
    this.ensureStrongCardPin(dto.pin);

    const existingPending = await this.atmCardRequestModel.exists({
      memberId,
      status: { $in: ['submitted', 'branch_review', 'card_production'] },
    });

    if (existingPending) {
      throw new BadRequestException(
        'An ATM card request is already in progress for this member.',
      );
    }

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
      pinHash: this.hashSecret(dto.pin),
      status: 'submitted',
    });

    await this.auditService.log({
      actorId: memberId.toString(),
      actorRole: currentUser.role,
      actionType: 'atm_card_request_submitted',
      entityType: 'atm_card_request',
      entityId: request._id.toString(),
      before: null,
      after: {
        phoneNumber: dto.phoneNumber,
        preferredBranch: dto.preferredBranch,
        status: 'submitted',
      },
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
    const member = await this.loadEligibleMember(currentUser);

    if (member.phone === dto.phoneNumber) {
      throw new BadRequestException(
        'Requested phone number must be different from the current phone number.',
      );
    }

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

    await this.auditService.log({
      actorId: memberId.toString(),
      actorRole: currentUser.role,
      actionType: 'phone_update_requested',
      entityType: 'phone_update_request',
      entityId: request._id.toString(),
      before: { phoneNumber: member.phone },
      after: { requestedPhoneNumber: dto.phoneNumber, status: 'pending_review' },
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
    await this.loadEligibleMember(currentUser);
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

    await this.auditService.log({
      actorId: memberId.toString(),
      actorRole: currentUser.role,
      actionType: 'account_member_add_requested',
      entityType: 'account_member_request',
      entityId: request._id.toString(),
      before: null,
      after: {
        memberName: dto.memberName,
        relationship: dto.relationship,
        status: 'pending_review',
      },
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
    await this.loadEligibleMember(currentUser, { requireVerifiedKyc: false });
    const record = await this.selfieVerificationModel.create({
      memberId,
      imageReference: dto.imageReference,
      purpose: dto.purpose,
      status: 'manual_review_required',
    });

    await this.auditService.log({
      actorId: memberId.toString(),
      actorRole: currentUser.role,
      actionType: 'selfie_verification_requested',
      entityType: 'selfie_verification',
      entityId: record._id.toString(),
      before: null,
      after: {
        purpose: dto.purpose,
        status: 'manual_review_required',
      },
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

  private async loadEligibleMember(
    currentUser: AuthenticatedUser,
    options: { requireVerifiedKyc?: boolean; ignoreAccountLock?: boolean } = {},
  ) {
    const requireVerifiedKyc = options.requireVerifiedKyc ?? true;
    const ignoreAccountLock = options.ignoreAccountLock ?? false;
    const memberId = this.toObjectId(currentUser.memberId ?? currentUser.sub);
    const [member, security] = await Promise.all([
      this.memberModel.findById(memberId).lean<MemberDocument | null>(),
      this.securityModel
        .findOne({ memberId })
        .lean<MemberSecuritySettingDocument | null>(),
    ]);

    if (!member || !member.isActive) {
      throw new ForbiddenException('Inactive members cannot use this service.');
    }

    if (
      requireVerifiedKyc &&
      !['verified', 'demo_approved', 'active_demo'].includes(member.kycStatus)
    ) {
      throw new ForbiddenException(
        'Complete Fayda verification before using this service.',
      );
    }

    if (!ignoreAccountLock && security?.accountLockEnabled) {
      throw new ForbiddenException(
        'Account lock is enabled. Unlock the account before continuing.',
      );
    }

    return member;
  }

  private ensureProfileMatchesMember(
    member: MemberDocument,
    firstName: string,
    lastName: string,
    phoneNumber: string,
  ) {
    if (member.phone !== phoneNumber) {
      throw new BadRequestException(
        'The request phone number must match the member profile.',
      );
    }

    const normalizedFirstName = firstName.trim().toLowerCase();
    const normalizedLastName = lastName.trim().toLowerCase();

    if (
      member.firstName.trim().toLowerCase() !== normalizedFirstName ||
      member.lastName.trim().toLowerCase() !== normalizedLastName
    ) {
      throw new BadRequestException(
        'The requested card profile must match the verified member name.',
      );
    }
  }

  private ensureStrongCardPin(pin: string) {
    if (!/^\d{4}$/.test(pin)) {
      throw new BadRequestException('Card PIN must be exactly 4 digits.');
    }

    if (/^(\d)\1{3}$/.test(pin) || pin === '1234' || pin === '4321') {
      throw new BadRequestException(
        'Choose a stronger ATM card PIN than common repeated or sequential values.',
      );
    }
  }

  private hashSecret(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }
}
