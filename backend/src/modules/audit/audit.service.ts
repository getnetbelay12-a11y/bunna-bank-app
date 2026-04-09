import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { UserRole } from '../../common/enums';
import { CreateAuditLogDto, ListAuditLogsQueryDto } from './dto';
import { AuditLogResult } from './interfaces';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  async log(dto: CreateAuditLogDto): Promise<AuditLogResult> {
    const auditLog = await this.auditLogModel.create({
      actorId: new Types.ObjectId(dto.actorId),
      actorRole: dto.actorRole,
      actionType: dto.actionType,
      entityType: dto.entityType,
      entityId: new Types.ObjectId(dto.entityId),
      before: dto.before ?? null,
      after: dto.after ?? null,
    });

    return this.toResult(auditLog);
  }

  async logActorAction(input: {
    actorId: string;
    actorRole: UserRole;
    actionType: string;
    entityType: string;
    entityId: string;
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
  }): Promise<AuditLogResult> {
    return this.log({
      actorId: input.actorId,
      actorRole: input.actorRole,
      actionType: input.actionType,
      entityType: input.entityType,
      entityId: input.entityId,
      before: input.before,
      after: input.after,
    });
  }

  async listByEntity(entityType: string, entityId: string): Promise<AuditLogResult[]> {
    const logs = await this.auditLogModel
      .find({
        entityType,
        entityId: new Types.ObjectId(entityId),
      })
      .sort({ createdAt: -1 })
      .lean<AuditLogDocument[]>();

    return logs.map((log) => this.toResult(log));
  }

  async listByActor(actorId: string): Promise<AuditLogResult[]> {
    const logs = await this.auditLogModel
      .find({ actorId: new Types.ObjectId(actorId) })
      .sort({ createdAt: -1 })
      .lean<AuditLogDocument[]>();

    return logs.map((log) => this.toResult(log));
  }

  async list(query: ListAuditLogsQueryDto): Promise<AuditLogResult[]> {
    const filter: Record<string, unknown> = {};

    if (query.actorId) {
      filter.actorId = new Types.ObjectId(query.actorId);
    }

    if (query.entityType) {
      filter.entityType = query.entityType;
    }

    if (query.entityId) {
      filter.entityId = new Types.ObjectId(query.entityId);
    }

    if (query.actionType) {
      filter.actionType = query.actionType;
    }

    const logs = await this.auditLogModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean<AuditLogDocument[]>();

    return logs.map((log) => this.toResult(log));
  }

  private toResult(log: AuditLogDocument | (AuditLogDocument & { id?: string })): AuditLogResult {
    return {
      id: log.id ?? log._id.toString(),
      actorId: log.actorId.toString(),
      actorRole: log.actorRole,
      actionType: log.actionType,
      entityType: log.entityType,
      entityId: log.entityId.toString(),
      before: log.before,
      after: log.after,
      createdAt: log.createdAt,
      updatedAt: log.updatedAt,
    };
  }
}
