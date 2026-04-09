import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';

import { Member, MemberDocument } from './schemas/member.schema';
import { MemberListResult, MemberProfile } from './interfaces';
import { CreateMemberDto, ListMembersQueryDto, UpdateMyProfileDto } from './dto';

@Injectable()
export class MembersRepository {
  constructor(
    @InjectModel(Member.name)
    private readonly memberModel: Model<MemberDocument>,
  ) {}

  async findById(id: string): Promise<MemberProfile | null> {
    const member = await this.memberModel
      .findById(id)
      .populate({ path: 'branchId', select: 'name' })
      .populate({ path: 'districtId', select: 'name' })
      .lean<MemberProfile | null>();

    return member ? this.toProfile(member) : null;
  }

  async findByCustomerId(customerId: string): Promise<MemberProfile | null> {
    const normalized = customerId.trim();
    if (!normalized) {
      return null;
    }

    const member = await this.memberModel
      .findOne({
        $or: [
          { customerId: normalized },
          { customerId: normalized.toUpperCase() },
          { memberNumber: normalized },
          { memberNumber: normalized.toUpperCase() },
        ],
      })
      .populate({ path: 'branchId', select: 'name' })
      .populate({ path: 'districtId', select: 'name' })
      .lean<MemberProfile | null>();

    return member ? this.toProfile(member) : null;
  }

  async updateById(id: string, dto: UpdateMyProfileDto): Promise<MemberProfile> {
    const member = await this.memberModel
      .findByIdAndUpdate(
        id,
        { $set: dto },
        { new: true, lean: true, runValidators: true },
      )
      .populate({ path: 'branchId', select: 'name' })
      .populate({ path: 'districtId', select: 'name' })
      .lean<MemberProfile | null>();

    if (!member) {
      throw new NotFoundException('Member not found.');
    }

    return this.toProfile(member);
  }

  async create(dto: CreateMemberDto): Promise<MemberProfile> {
    const member = await this.memberModel.create({
      ...dto,
      passwordHash: dto.password,
      isActive: true,
    });

    const created = await this.memberModel
      .findById(member._id)
      .populate({ path: 'branchId', select: 'name' })
      .populate({ path: 'districtId', select: 'name' })
      .lean<MemberProfile | null>();

    if (!created) {
      throw new NotFoundException('Member not found.');
    }

    return this.toProfile(created);
  }

  async list(query: ListMembersQueryDto): Promise<MemberListResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const filter: FilterQuery<MemberDocument> = {};

    if (query.memberType) {
      filter.memberType = query.memberType;
    }

    if (query.role) {
      filter.role = query.role;
    }

    if (query.branchId) {
      filter.branchId = query.branchId;
    }

    if (query.districtId) {
      filter.districtId = query.districtId;
    }

    if (typeof query.isActive === 'boolean') {
      filter.isActive = query.isActive;
    }

    if (query.search) {
      filter.$or = [
        { fullName: { $regex: query.search, $options: 'i' } },
        { customerId: { $regex: query.search, $options: 'i' } },
        { memberNumber: { $regex: query.search, $options: 'i' } },
        { phone: { $regex: query.search, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.memberModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({ path: 'branchId', select: 'name' })
        .populate({ path: 'districtId', select: 'name' })
        .lean<MemberProfile[]>(),
      this.memberModel.countDocuments(filter),
    ]);

    return {
      items: items.map((item) => this.toProfile(item)),
      total,
      page,
      limit,
    };
  }

  private toProfile(member: MemberProfile & { _id?: string }): MemberProfile {
    const branchValue = member.branchId as unknown as
      | string
      | { _id?: { toString(): string }; name?: string; toString(): string };
    const districtValue = member.districtId as unknown as
      | string
      | { _id?: { toString(): string }; name?: string; toString(): string };

    return {
      ...member,
      id: member.id ?? member._id?.toString?.() ?? '',
      customerId: member.customerId,
      branchId:
        typeof branchValue === 'string'
          ? branchValue
          : branchValue._id?.toString?.() ?? branchValue.toString(),
      branchName: typeof branchValue === 'string' ? undefined : branchValue.name,
      districtId:
        typeof districtValue === 'string'
          ? districtValue
          : districtValue._id?.toString?.() ?? districtValue.toString(),
      districtName:
        typeof districtValue === 'string' ? undefined : districtValue.name,
    };
  }
}
