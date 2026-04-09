import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { AuthenticatedUser } from '../auth/interfaces';
import { MemberProfilesService } from '../member-profiles/member-profiles.service';
import {
  FaydaVerificationProvider,
} from './interfaces/fayda-verification-provider.interface';
import { SubmitFaydaFinDto, UploadFaydaQrDto } from './dto';
import {
  IdentityVerification,
  IdentityVerificationDocument,
} from './schemas/identity-verification.schema';

export const FAYDA_VERIFICATION_PROVIDER = 'FAYDA_VERIFICATION_PROVIDER';

@Injectable()
export class IdentityVerificationService {
  constructor(
    @InjectModel(IdentityVerification.name)
    private readonly identityVerificationModel: Model<IdentityVerificationDocument>,
    private readonly memberProfilesService: MemberProfilesService,
    private readonly configService: ConfigService,
    @Inject(FAYDA_VERIFICATION_PROVIDER)
    private readonly provider: FaydaVerificationProvider,
  ) {}

  async start(currentUser: AuthenticatedUser, consentAccepted: boolean) {
    const result = await this.provider.start({
      memberId: currentUser.sub,
      phoneNumber: currentUser.phone ?? '',
      consentAccepted,
    });

    const record = await this.identityVerificationModel.create({
      memberId: new Types.ObjectId(currentUser.sub),
      phoneNumber: currentUser.phone ?? '',
      verificationMethod: result.verificationMethod,
      verificationStatus: result.verificationStatus,
      verificationReference: result.verificationReference,
    });

    await this.memberProfilesService.updateStatuses(currentUser.sub, {
      identityVerificationStatus: result.verificationStatus,
      membershipStatus: 'pending_verification',
    });

    return this.toResult(record);
  }

  async submitFin(currentUser: AuthenticatedUser, dto: SubmitFaydaFinDto) {
    const result = await this.provider.submitFin({
      memberId: currentUser.sub,
      phoneNumber: currentUser.phone ?? '',
      faydaFin: dto.faydaFin,
      faydaAlias: dto.faydaAlias,
    });

    const record = await this.identityVerificationModel.findOneAndUpdate(
      { memberId: new Types.ObjectId(currentUser.sub) },
      {
        $set: {
          phoneNumber: currentUser.phone ?? '',
          faydaFin: dto.faydaFin,
          faydaAlias: dto.faydaAlias,
          verificationMethod: result.verificationMethod,
          verificationStatus: result.verificationStatus,
          verificationReference: result.verificationReference,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    await this.memberProfilesService.updateStatuses(currentUser.sub, {
      identityVerificationStatus: result.verificationStatus,
    });

    return this.toResult(record);
  }

  async uploadQr(currentUser: AuthenticatedUser, dto: UploadFaydaQrDto) {
    const result = await this.provider.uploadQr({
      memberId: currentUser.sub,
      phoneNumber: currentUser.phone ?? '',
      qrDataRaw: dto.qrDataRaw,
      faydaAlias: dto.faydaAlias,
    });

    const record = await this.identityVerificationModel.findOneAndUpdate(
      { memberId: new Types.ObjectId(currentUser.sub) },
      {
        $set: {
          phoneNumber: currentUser.phone ?? '',
          qrDataRaw: dto.qrDataRaw,
          faydaAlias: dto.faydaAlias,
          verificationMethod: result.verificationMethod,
          verificationStatus: result.verificationStatus,
          verificationReference: result.verificationReference,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    await this.memberProfilesService.updateStatuses(currentUser.sub, {
      identityVerificationStatus: result.verificationStatus,
    });

    return this.toResult(record);
  }

  async verify(currentUser: AuthenticatedUser) {
    const existing = await this.identityVerificationModel.findOne({
      memberId: new Types.ObjectId(currentUser.sub),
    });

    if (!existing) {
      throw new NotFoundException('Fayda verification has not been started.');
    }

    if (existing.verificationStatus === 'verified') {
      return this.toResult(existing);
    }

    const result = await this.provider.verify({
      memberId: currentUser.sub,
      phoneNumber: existing.phoneNumber,
    });

    existing.verificationMethod = result.verificationMethod;
    existing.verificationStatus = result.verificationStatus;
    existing.verificationReference = result.verificationReference;
    existing.verifiedAt = result.verifiedAt;
    existing.failureReason = result.failureReason;
    await existing.save();

    await this.memberProfilesService.updateStatuses(currentUser.sub, {
      identityVerificationStatus: result.verificationStatus,
      membershipStatus:
        result.verificationStatus === 'verified'
          ? 'active'
          : 'pending_verification',
    });

    return this.toResult(existing);
  }

  async getStatus(currentUser: AuthenticatedUser) {
    const record = await this.identityVerificationModel
      .findOne({ memberId: new Types.ObjectId(currentUser.sub) })
      .sort({ createdAt: -1 });

    if (!record) {
      return {
        memberId: currentUser.sub,
        phoneNumber: currentUser.phone ?? '',
        verificationStatus: 'not_started',
        verificationMethod: this.resolveIntegrationMode() ? 'official_online_ekyc' : 'fin_plus_manual_review',
      };
    }

    return this.toResult(record);
  }

  private resolveIntegrationMode() {
    return this.configService.get<string>('FAYDA_PROVIDER_MODE') === 'official';
  }

  private toResult(
    record:
      | IdentityVerificationDocument
      | (IdentityVerificationDocument & { id?: string }),
  ) {
    return {
      id: record.id ?? record._id.toString(),
      memberId: record.memberId.toString(),
      phoneNumber: record.phoneNumber,
      faydaFin: this.maskFaydaFin(record.faydaFin),
      faydaAlias: record.faydaAlias,
      qrDataRaw: record.qrDataRaw ? '[redacted]' : undefined,
      verificationMethod: record.verificationMethod,
      verificationStatus: record.verificationStatus,
      verifiedAt: record.verifiedAt,
      verificationReference: record.verificationReference,
      failureReason: record.failureReason,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private maskFaydaFin(faydaFin?: string) {
    if (!faydaFin) {
      return undefined;
    }

    if (faydaFin.length <= 4) {
      return '*'.repeat(faydaFin.length);
    }

    return `${'*'.repeat(faydaFin.length - 4)}${faydaFin.slice(-4)}`;
  }
}
