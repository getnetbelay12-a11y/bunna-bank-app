import { UserRole } from '../../../common/enums';
export declare class CreateAuditLogDto {
    actorId: string;
    actorRole: UserRole;
    actionType: string;
    entityType: string;
    entityId: string;
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
    decisionVersion?: number;
    isCurrentDecision?: boolean;
    supersedesAuditId?: string;
    supersededByAuditId?: string;
}
