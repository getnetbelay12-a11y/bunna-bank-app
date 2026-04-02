import { Model } from 'mongoose';
import { AuthenticatedUser } from '../auth/interfaces';
import { ListStaffQueryDto } from './dto';
import { StaffProfile } from './interfaces';
import { StaffDocument } from './schemas/staff.schema';
export declare class StaffService {
    private readonly staffModel;
    constructor(staffModel: Model<StaffDocument>);
    getMyProfile(currentUser: AuthenticatedUser): Promise<StaffProfile>;
    getStaffById(currentUser: AuthenticatedUser, staffId: string): Promise<StaffProfile>;
    listStaff(currentUser: AuthenticatedUser, query: ListStaffQueryDto): Promise<StaffProfile[]>;
    getBranchStaff(currentUser: AuthenticatedUser, branchId: string): Promise<StaffProfile[]>;
    getDistrictStaff(currentUser: AuthenticatedUser, districtId: string): Promise<StaffProfile[]>;
    private findVisibleStaffById;
    private buildScopeFilter;
    private visibleBranchId;
    private visibleDistrictId;
    private ensureStaffPrincipal;
}
