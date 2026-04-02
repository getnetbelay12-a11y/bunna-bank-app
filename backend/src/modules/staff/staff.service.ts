import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';

import { UserRole } from '../../common/enums';
import { AuthenticatedUser } from '../auth/interfaces';
import { ListStaffQueryDto } from './dto';
import { StaffProfile } from './interfaces';
import { Staff, StaffDocument } from './schemas/staff.schema';

@Injectable()
export class StaffService {
  constructor(
    @InjectModel(Staff.name)
    private readonly staffModel: Model<StaffDocument>,
  ) {}

  async getMyProfile(currentUser: AuthenticatedUser): Promise<StaffProfile> {
    this.ensureStaffPrincipal(currentUser);

    const staff = await this.findVisibleStaffById(currentUser, currentUser.sub);

    if (!staff) {
      throw new NotFoundException('Staff profile not found.');
    }

    return staff;
  }

  async getStaffById(
    currentUser: AuthenticatedUser,
    staffId: string,
  ): Promise<StaffProfile> {
    this.ensureStaffPrincipal(currentUser);

    const staff = await this.findVisibleStaffById(currentUser, staffId);

    if (!staff) {
      throw new NotFoundException('Staff member not found.');
    }

    return staff;
  }

  async listStaff(
    currentUser: AuthenticatedUser,
    query: ListStaffQueryDto,
  ): Promise<StaffProfile[]> {
    this.ensureStaffPrincipal(currentUser);

    const match = this.buildScopeFilter(currentUser);

    if (query.role) {
      match.role = query.role;
    }

    if (query.isActive !== undefined) {
      match.isActive = query.isActive === 'true';
    }

    if (query.branchId) {
      match.branchId = this.visibleBranchId(currentUser, query.branchId);
    }

    if (query.districtId) {
      match.districtId = this.visibleDistrictId(currentUser, query.districtId);
    }

    return this.staffModel
      .find(match)
      .sort({ role: 1, fullName: 1 })
      .lean<StaffProfile[]>()
      .exec();
  }

  async getBranchStaff(
    currentUser: AuthenticatedUser,
    branchId: string,
  ): Promise<StaffProfile[]> {
    this.ensureStaffPrincipal(currentUser);

    return this.staffModel
      .find({
        ...this.buildScopeFilter(currentUser),
        branchId: this.visibleBranchId(currentUser, branchId),
      })
      .sort({ role: 1, fullName: 1 })
      .lean<StaffProfile[]>()
      .exec();
  }

  async getDistrictStaff(
    currentUser: AuthenticatedUser,
    districtId: string,
  ): Promise<StaffProfile[]> {
    this.ensureStaffPrincipal(currentUser);

    return this.staffModel
      .find({
        ...this.buildScopeFilter(currentUser),
        districtId: this.visibleDistrictId(currentUser, districtId),
      })
      .sort({ role: 1, fullName: 1 })
      .lean<StaffProfile[]>()
      .exec();
  }

  private findVisibleStaffById(
    currentUser: AuthenticatedUser,
    staffId: string,
  ): Promise<StaffProfile | null> {
    return this.staffModel
      .findOne({
        _id: new Types.ObjectId(staffId),
        ...this.buildScopeFilter(currentUser),
      })
      .lean<StaffProfile | null>()
      .exec();
  }

  private buildScopeFilter(
    currentUser: AuthenticatedUser,
  ): FilterQuery<StaffDocument> {
    const filter: FilterQuery<StaffDocument> = {};

    if (currentUser.role === UserRole.BRANCH_MANAGER && currentUser.branchId) {
      filter.branchId = new Types.ObjectId(currentUser.branchId);
    }

    if (
      (currentUser.role === UserRole.DISTRICT_OFFICER ||
        currentUser.role === UserRole.DISTRICT_MANAGER) &&
      currentUser.districtId
    ) {
      filter.districtId = new Types.ObjectId(currentUser.districtId);
    }

    return filter;
  }

  private visibleBranchId(
    currentUser: AuthenticatedUser,
    branchId: string,
  ): Types.ObjectId {
    if (
      currentUser.role === UserRole.BRANCH_MANAGER &&
      currentUser.branchId &&
      currentUser.branchId !== branchId
    ) {
      throw new ForbiddenException('Cannot access staff outside your branch.');
    }

    return new Types.ObjectId(branchId);
  }

  private visibleDistrictId(
    currentUser: AuthenticatedUser,
    districtId: string,
  ): Types.ObjectId {
    if (
      (currentUser.role === UserRole.DISTRICT_OFFICER ||
        currentUser.role === UserRole.DISTRICT_MANAGER) &&
      currentUser.districtId &&
      currentUser.districtId !== districtId
    ) {
      throw new ForbiddenException('Cannot access staff outside your district.');
    }

    if (
      currentUser.role === UserRole.BRANCH_MANAGER &&
      currentUser.districtId &&
      currentUser.districtId !== districtId
    ) {
      throw new ForbiddenException('Cannot access staff outside your district.');
    }

    return new Types.ObjectId(districtId);
  }

  private ensureStaffPrincipal(currentUser: AuthenticatedUser): void {
    if (
      currentUser.role === UserRole.MEMBER ||
      currentUser.role === UserRole.SHAREHOLDER_MEMBER
    ) {
      throw new ForbiddenException('Only staff users can access this resource.');
    }
  }
}
