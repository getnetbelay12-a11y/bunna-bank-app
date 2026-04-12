import { createHmac } from 'node:crypto';

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { UserRole } from '../../common/enums';
import {
  CreateAuditLogDto,
  ListAuditLogsQueryDto,
  ListOnboardingReviewAuditQueryDto,
} from './dto';
import { AuditLogResult } from './interfaces';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';
import { Member, MemberDocument } from '../members/schemas/member.schema';
import { Staff, StaffDocument } from '../staff/schemas/staff.schema';

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLogDocument>,
    @InjectModel(Staff.name)
    private readonly staffModel: Model<StaffDocument>,
    @InjectModel(Member.name)
    private readonly memberModel: Model<MemberDocument>,
    private readonly configService: ConfigService,
  ) {}

  async log(dto: CreateAuditLogDto): Promise<AuditLogResult> {
    const createdAt = new Date();
    const auditLog = await this.auditLogModel.create({
      actorId: new Types.ObjectId(dto.actorId),
      actorRole: dto.actorRole,
      actionType: dto.actionType,
      entityType: dto.entityType,
      entityId: new Types.ObjectId(dto.entityId),
      before: dto.before ?? null,
      after: dto.after ?? null,
      auditDigest: this.computeAuditDigest(dto, createdAt),
      decisionVersion: dto.decisionVersion,
      isCurrentDecision: dto.isCurrentDecision,
      supersedesAuditId: dto.supersedesAuditId
        ? new Types.ObjectId(dto.supersedesAuditId)
        : undefined,
      supersededByAuditId: dto.supersededByAuditId
        ? new Types.ObjectId(dto.supersededByAuditId)
        : undefined,
      createdAt,
      updatedAt: createdAt,
    });

    return this.toResult(auditLog);
  }

  async logOnboardingReviewDecision(input: {
    actorId: string;
    actorRole: UserRole;
    entityId: string;
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
    supersessionReasonCode?: string;
    acknowledgedSupersessionFields?: string[];
  }): Promise<AuditLogResult> {
    const memberObjectId = new Types.ObjectId(input.entityId);
    const previousDecision = await this.auditLogModel
      .findOne({
        actionType: 'onboarding_review_updated',
        entityType: 'member',
        entityId: memberObjectId,
        isCurrentDecision: true,
      })
      .sort({ createdAt: -1 })
      .lean<AuditLogDocument | null>();

    if (previousDecision != null && !input.supersessionReasonCode?.trim()) {
      throw new BadRequestException(
        'Supersession reason code is required when replacing an existing onboarding review decision.',
      );
    }

    const changedFields = previousDecision
      ? this.buildDecisionDiff(previousDecision.after, input.after)
      : [];

    if (previousDecision != null) {
      const acknowledgedFields = new Set(
        (input.acknowledgedSupersessionFields ?? [])
          .map((field) => field.trim())
          .filter(Boolean),
      );
      const missingAcknowledgements = changedFields
        .map((item) => item.field)
        .filter((field) => !acknowledgedFields.has(field));

      if (missingAcknowledgements.length > 0) {
        throw new BadRequestException(
          `Supersession diff must be acknowledged before replacing a decision: ${missingAcknowledgements.join(', ')}.`,
        );
      }
    }

    const nextAfter = previousDecision
      ? {
          ...(input.after ?? {}),
          supersession: {
            reasonCode: input.supersessionReasonCode?.trim(),
            previousAuditId: previousDecision._id.toString(),
            previousDecisionVersion: previousDecision.decisionVersion ?? 1,
            acknowledgedFields: input.acknowledgedSupersessionFields ?? [],
            changedFields,
          },
        }
      : input.after;

    const decision = await this.log({
      actorId: input.actorId,
      actorRole: input.actorRole,
      actionType: 'onboarding_review_updated',
      entityType: 'member',
      entityId: input.entityId,
      before: input.before,
      after: nextAfter,
      decisionVersion: (previousDecision?.decisionVersion ?? 0) + 1,
      isCurrentDecision: true,
      supersedesAuditId: previousDecision?._id?.toString(),
    });

    if (previousDecision?._id) {
      await this.auditLogModel.updateOne(
        { _id: previousDecision._id },
        {
          $set: {
            isCurrentDecision: false,
            supersededByAuditId: new Types.ObjectId(decision.id),
            updatedAt: new Date(),
          },
        },
      );
    }

    return decision;
  }

  async getCurrentOnboardingReviewDecision(memberId: string) {
    const decision = await this.auditLogModel
      .findOne({
        actionType: 'onboarding_review_updated',
        entityType: 'member',
        entityId: new Types.ObjectId(memberId),
        isCurrentDecision: true,
      })
      .sort({ createdAt: -1 })
      .lean<AuditLogDocument | null>();

    return decision ? this.toResult(decision) : null;
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

  async verifyAuditLog(auditId: string): Promise<import('./interfaces').AuditLogVerificationResult> {
    const log = await this.auditLogModel.findById(auditId).lean<AuditLogDocument | null>();

    if (!log) {
      throw new NotFoundException('Audit log was not found.');
    }

    const recomputedDigest = this.computeAuditDigest(
      {
        actorId: log.actorId.toString(),
        actorRole: log.actorRole,
        actionType: log.actionType,
        entityType: log.entityType,
        entityId: log.entityId.toString(),
        before: log.before,
        after: log.after,
      },
      log.createdAt ?? new Date(0),
    );

    return {
      auditId: log._id.toString(),
      auditDigest: log.auditDigest,
      recomputedDigest,
      isValid: log.auditDigest === recomputedDigest,
    };
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

  async listOnboardingReviewDecisions(
    query: ListOnboardingReviewAuditQueryDto,
  ): Promise<AuditLogResult[]> {
    const filter: Record<string, unknown> = {
      actionType: 'onboarding_review_updated',
      entityType: 'member',
    };

    if (query.actorId) {
      filter.actorId = new Types.ObjectId(query.actorId);
    }

    if (query.memberId) {
      filter.entityId = new Types.ObjectId(query.memberId);
    }

    if (query.status) {
      filter['after.status'] = query.status;
    }

    if (query.approvalReasonCode) {
      filter['after.approvalReasonCode'] = query.approvalReasonCode;
    }

    if (query.currentOnly === 'true') {
      filter.isCurrentDecision = true;
    }

    if (query.dateFrom || query.dateTo) {
      const createdAt: Record<string, Date> = {};
      if (query.dateFrom) {
        createdAt.$gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        createdAt.$lte = new Date(query.dateTo);
      }
      filter.createdAt = createdAt;
    }

    const logs = await this.auditLogModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean<AuditLogDocument[]>();

    return logs.map((log) => this.toResult(log));
  }

  async exportOnboardingReviewDecisionsCsv(
    query: ListOnboardingReviewAuditQueryDto,
  ): Promise<string> {
    const logs = await this.listOnboardingReviewDecisions(query);
    const actorIds = Array.from(new Set(logs.map((log) => log.actorId)));
    const memberIds = Array.from(new Set(logs.map((log) => log.entityId)));
    const [staffRecords, memberRecords] = await Promise.all([
      actorIds.length > 0
        ? this.staffModel
            .find({ _id: { $in: actorIds.map((id) => new Types.ObjectId(id)) } })
            .lean<StaffDocument[]>()
        : Promise.resolve([]),
      memberIds.length > 0
        ? this.memberModel
            .find({ _id: { $in: memberIds.map((id) => new Types.ObjectId(id)) } })
            .lean<MemberDocument[]>()
        : Promise.resolve([]),
    ]);
    const staffById = new Map(
      staffRecords.map((record) => [record._id.toString(), record]),
    );
    const memberById = new Map(
      memberRecords.map((record) => [record._id.toString(), record]),
    );
    const headers = [
      'auditId',
      'createdAt',
      'actorId',
      'actorIdentifier',
      'actorFullName',
      'actorRole',
      'actorBranchId',
      'actorDistrictId',
      'memberId',
      'memberCustomerId',
      'memberFullName',
      'memberBranchId',
      'memberDistrictId',
      'memberPreferredBranchName',
      'status',
      'approvalReasonCode',
      'approvalJustification',
      'supersessionReasonCode',
      'acknowledgedMismatchFields',
      'blockingMismatchFields',
      'policyVersion',
      'decisionVersion',
      'isCurrentDecision',
      'supersedesAuditId',
      'supersededByAuditId',
    ];
    const rows = logs.map((log) => {
      const after = this.asRecord(log.after);
      const supersession = this.asRecord(after?.supersession);
      const reviewPolicySnapshot = this.asRecord(after?.reviewPolicySnapshot);
      const actor = staffById.get(log.actorId);
      const member = memberById.get(log.entityId);

      return [
        log.id,
        log.createdAt?.toISOString() ?? '',
        log.actorId,
        actor?.identifier ?? '',
        actor?.fullName ?? '',
        log.actorRole,
        actor?.branchId?.toString() ?? '',
        actor?.districtId?.toString() ?? '',
        log.entityId,
        member?.customerId ?? '',
        member?.fullName ?? '',
        member?.branchId?.toString() ?? '',
        member?.districtId?.toString() ?? '',
        member?.preferredBranchName ?? '',
        this.asString(after?.status),
        this.asString(after?.approvalReasonCode),
        this.asString(after?.approvalJustification),
        this.asString(supersession?.reasonCode),
        this.asStringArray(after?.acknowledgedMismatchFields).join('|'),
        this.asStringArray(after?.blockingMismatchFields).join('|'),
        this.asString(reviewPolicySnapshot?.policyVersion),
        log.decisionVersion?.toString() ?? '',
        log.isCurrentDecision == null ? '' : String(log.isCurrentDecision),
        log.supersedesAuditId ?? '',
        log.supersededByAuditId ?? '',
      ];
    });

    return [headers, ...rows]
      .map((row) => row.map((value) => this.escapeCsvValue(value)).join(','))
      .join('\n');
  }

  private toResult(log: AuditLogDocument | (AuditLogDocument & { id?: string })): AuditLogResult {
    return {
      id: log.id ?? log._id.toString(),
      actorId: log.actorId.toString(),
      actorRole: log.actorRole,
      actionType: log.actionType,
      entityType: log.entityType,
      entityId: log.entityId.toString(),
      auditDigest: log.auditDigest,
      decisionVersion: log.decisionVersion,
      isCurrentDecision: log.isCurrentDecision,
      supersedesAuditId: log.supersedesAuditId?.toString(),
      supersededByAuditId: log.supersededByAuditId?.toString(),
      before: log.before,
      after: log.after,
      createdAt: log.createdAt,
      updatedAt: log.updatedAt,
    };
  }

  private computeAuditDigest(dto: CreateAuditLogDto, createdAt: Date) {
    const secret =
      this.configService.get<string>('AUDIT_DIGEST_SECRET') ??
      this.configService.get<string>('JWT_SECRET') ??
      'bunna-audit-digest-fallback';
    const payload = this.stableStringify({
      actorId: dto.actorId,
      actorRole: dto.actorRole,
      actionType: dto.actionType,
      entityType: dto.entityType,
      entityId: dto.entityId,
      before: dto.before ?? null,
      after: dto.after ?? null,
      createdAt: createdAt.toISOString(),
    });

    return createHmac('sha256', secret).update(payload).digest('hex');
  }

  private stableStringify(value: unknown): string {
    return JSON.stringify(this.sortValue(value));
  }

  private sortValue(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.sortValue(item));
    }

    if (value != null && typeof value === 'object') {
      return Object.keys(value as Record<string, unknown>)
        .sort()
        .reduce<Record<string, unknown>>((result, key) => {
          result[key] = this.sortValue((value as Record<string, unknown>)[key]);
          return result;
        }, {});
    }

    return value;
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    if (value == null || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }

    return value as Record<string, unknown>;
  }

  private asString(value: unknown) {
    return typeof value === 'string' ? value : '';
  }

  private asStringArray(value: unknown) {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter((item): item is string => typeof item === 'string');
  }

  private escapeCsvValue(value: unknown) {
    const normalized = String(value ?? '');
    return `"${normalized.replace(/"/g, '""')}"`;
  }

  private buildDecisionDiff(previousValue: unknown, nextValue: unknown) {
    const previousFlat = this.flattenDecisionValue(previousValue);
    const nextFlat = this.flattenDecisionValue(nextValue);
    const keys = Array.from(new Set([...Object.keys(previousFlat), ...Object.keys(nextFlat)])).sort();

    return keys
      .filter((key) => previousFlat[key] !== nextFlat[key])
      .map((key) => ({
        field: key,
        previousValue: previousFlat[key] ?? '',
        nextValue: nextFlat[key] ?? '',
      }));
  }

  private flattenDecisionValue(value: unknown, prefix = ''): Record<string, string> {
    if (value == null) {
      return prefix ? { [prefix]: '' } : {};
    }

    if (Array.isArray(value)) {
      return prefix ? { [prefix]: this.stableStringify(value) } : {};
    }

    if (typeof value === 'object') {
      return Object.entries(value as Record<string, unknown>).reduce<Record<string, string>>(
        (result, [key, nestedValue]) => {
          const nestedPrefix = prefix ? `${prefix}.${key}` : key;
          Object.assign(result, this.flattenDecisionValue(nestedValue, nestedPrefix));
          return result;
        },
        {},
      );
    }

    return prefix ? { [prefix]: String(value) } : {};
  }
}
