import { ActivityType } from '../../../common/enums';
export declare class RecordStaffActivityDto {
    staffId: string;
    memberId?: string;
    branchId: string;
    districtId: string;
    activityType: ActivityType;
    referenceType?: string;
    referenceId?: string;
    amount?: number;
    createdAt?: Date;
}
