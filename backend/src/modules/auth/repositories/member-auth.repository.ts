import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { MemberDocument, Member } from '../../members/schemas/member.schema';
import { AuthPrincipal } from '../interfaces';
import { MemberAuthRepository } from '../auth.types';

@Injectable()
export class MongooseMemberAuthRepository implements MemberAuthRepository {
  private readonly logger = new Logger(MongooseMemberAuthRepository.name);

  constructor(
    @InjectModel(Member.name)
    private readonly memberModel: Model<MemberDocument>,
  ) {}

  async findByCustomerId(customerId: string): Promise<AuthPrincipal | null> {
    const normalized = customerId.trim();
    const normalizedUpper = normalized.toUpperCase();
    const normalizedPhone = normalizePhoneNumber(normalized);
    const phoneCandidates = Array.from(
      new Set([normalizedPhone, ...resolveDemoPhoneAliases(normalizedPhone)]),
    );
    const query = {
      isActive: true,
      $or: [
        { phone: { $in: phoneCandidates } },
        { memberNumber: normalizedUpper },
        { customerId: normalizedUpper },
      ],
    };

    this.logger.log(
      `member lookup input=${customerId} normalized=${normalizedUpper} phones=${phoneCandidates.join(',')}`,
    );

    const member = await this.memberModel
      .findOne(query)
      .populate({ path: 'branchId', select: 'name' })
      .populate({ path: 'districtId', select: 'name' })
      .lean<
        | ({
            _id: { toString(): string };
            role: AuthPrincipal['role'];
            passwordHash: string;
            memberType: AuthPrincipal['memberType'];
            fullName: string;
            memberNumber: string;
            phone: string;
            branchId: { _id?: { toString(): string }; name?: string } | string;
            districtId: { _id?: { toString(): string }; name?: string } | string;
          } & Record<string, unknown>)
        | null
      >();

    if (!member) {
      this.logger.warn(`member lookup not found query=${JSON.stringify(query)}`);
      return null;
    }

    this.logger.log(
      `member lookup found _id=${member._id.toString()} customerId=${(member as { customerId?: string }).customerId ?? member.memberNumber} memberNumber=${member.memberNumber} phone=${member.phone}`,
    );

    const branch =
      typeof member.branchId === 'string'
        ? { id: member.branchId, name: undefined }
        : {
            id:
              member.branchId?._id?.toString?.() ??
              (member.branchId as unknown as { toString(): string })?.toString?.(),
            name: member.branchId?.name,
          };
    const district =
      typeof member.districtId === 'string'
        ? { id: member.districtId, name: undefined }
        : {
            id:
              member.districtId?._id?.toString?.() ??
              (member.districtId as unknown as { toString(): string })?.toString?.(),
            name: member.districtId?.name,
          };

    return {
      id: member._id.toString(),
      customerId:
        (member as { customerId?: string }).customerId ?? member.memberNumber,
      role: member.role,
      passwordHash: member.passwordHash,
      memberType: member.memberType,
      fullName: member.fullName,
      memberNumber: member.memberNumber,
      phone: member.phone,
      branchId: branch.id,
      districtId: district.id,
      branchName: branch.name,
      districtName: district.name,
    };
  }
}

function normalizePhoneNumber(value: string) {
  const digitsOnly = value.replace(/\D/g, '');

  if (digitsOnly.startsWith('251') && digitsOnly.length === 12) {
    return `0${digitsOnly.slice(3)}`;
  }

  if (digitsOnly.length === 9 && !digitsOnly.startsWith('0')) {
    return `0${digitsOnly}`;
  }

  return digitsOnly.length > 0 ? digitsOnly : value;
}

function resolveDemoPhoneAliases(phone: string) {
  if (phone === '0900000001') {
    return ['0911000001'];
  }

  return [];
}
