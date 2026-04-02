import { AuthenticatedUser } from '../auth/interfaces';
import { RecordStaffActivityDto, StaffPerformanceQueryDto } from './dto';
import { StaffActivityService } from './staff-activity.service';
export declare class StaffActivityController {
    private readonly staffActivityService;
    constructor(staffActivityService: StaffActivityService);
    recordActivity(dto: RecordStaffActivityDto): Promise<{
        id: string;
        activityType: import("../../common/enums").ActivityType;
    }>;
    getPerformance(currentUser: AuthenticatedUser, query: StaffPerformanceQueryDto): Promise<import("./interfaces").StaffPerformanceRecord[]>;
}
