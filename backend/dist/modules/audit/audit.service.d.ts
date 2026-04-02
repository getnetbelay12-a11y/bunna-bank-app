import { Model } from 'mongoose';
import { CreateAuditLogDto, ListAuditLogsQueryDto } from './dto';
import { AuditLogResult } from './interfaces';
import { AuditLogDocument } from './schemas/audit-log.schema';
export declare class AuditService {
    private readonly auditLogModel;
    constructor(auditLogModel: Model<AuditLogDocument>);
    log(dto: CreateAuditLogDto): Promise<AuditLogResult>;
    listByEntity(entityType: string, entityId: string): Promise<AuditLogResult[]>;
    listByActor(actorId: string): Promise<AuditLogResult[]>;
    list(query: ListAuditLogsQueryDto): Promise<AuditLogResult[]>;
    private toResult;
}
