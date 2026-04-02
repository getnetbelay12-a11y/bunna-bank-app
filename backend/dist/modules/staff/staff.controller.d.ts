import { AuthenticatedUser } from '../auth/interfaces';
import { ListStaffQueryDto } from './dto';
import { StaffService } from './staff.service';
export declare class StaffController {
    private readonly staffService;
    constructor(staffService: StaffService);
    getMyProfile(currentUser: AuthenticatedUser): Promise<import("./interfaces").StaffProfile>;
    listStaff(currentUser: AuthenticatedUser, query: ListStaffQueryDto): Promise<import("./interfaces").StaffProfile[]>;
    getBranchStaff(currentUser: AuthenticatedUser, branchId: string): Promise<import("./interfaces").StaffProfile[]>;
    getDistrictStaff(currentUser: AuthenticatedUser, districtId: string): Promise<import("./interfaces").StaffProfile[]>;
    getStaffById(currentUser: AuthenticatedUser, staffId: string): Promise<import("./interfaces").StaffProfile>;
}
