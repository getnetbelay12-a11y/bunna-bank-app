import { UserRole } from '../../../common/enums';
export interface AuditLogResult {
    id: string;
    actorId: string;
    actorRole: UserRole;
    actionType: string;
    entityType: string;
    entityId: string;
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
    createdAt?: Date;
    updatedAt?: Date;
}
