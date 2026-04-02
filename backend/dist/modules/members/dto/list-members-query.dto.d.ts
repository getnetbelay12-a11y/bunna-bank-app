import { PaginationQueryDto } from '../../../common/dto';
import { MemberType, UserRole } from '../../../common/enums';
export declare class ListMembersQueryDto extends PaginationQueryDto {
    memberType?: MemberType;
    role?: UserRole;
    branchId?: string;
    districtId?: string;
    isActive?: boolean;
    search?: string;
}
