import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoServerError } from 'mongodb';

import { CreateGuardianStudentLinkDto } from './dto/create-guardian-student-link.dto';
import { UpdateGuardianStudentLinkDto } from './dto/update-guardian-student-link.dto';
import {
  GuardianStudentLinkDocument,
  GuardianStudentLinkEntity,
} from './schemas/guardian-student-link.schema';

export type GuardianStudentLink = {
  linkId: string;
  studentId: string;
  guardianId: string;
  memberCustomerId: string;
 relationship: string;
  status: string;
};

const GUARDIAN_STUDENT_LINK_FIXTURES: GuardianStudentLink[] = [
  {
    linkId: 'GSL-1001',
    studentId: 'ST-1001',
    guardianId: 'GDN-1001',
    memberCustomerId: 'BUN-100001',
    relationship: 'father',
    status: 'active',
  },
];

@Injectable()
export class GuardianStudentLinksService implements OnModuleInit {
  private readonly logger = new Logger(GuardianStudentLinksService.name);

  constructor(
    @InjectModel(GuardianStudentLinkEntity.name)
    private readonly guardianStudentLinkModel: Model<GuardianStudentLinkDocument>,
  ) {}

  async onModuleInit() {
    const existingCount = await this.guardianStudentLinkModel.countDocuments();
    if (existingCount > 0) {
      return;
    }

    await this.guardianStudentLinkModel.insertMany(GUARDIAN_STUDENT_LINK_FIXTURES, {
      ordered: false,
    });
    this.logger.log(
      `Seeded ${GUARDIAN_STUDENT_LINK_FIXTURES.length} guardian-student link records.`,
    );
  }

  async list(filters?: {
    studentId?: string;
    guardianId?: string;
    memberCustomerId?: string;
    status?: string;
  }) {
    const query: Record<string, string> = {};

    if (filters?.studentId) {
      query.studentId = filters.studentId;
    }

    if (filters?.guardianId) {
      query.guardianId = filters.guardianId;
    }

    if (filters?.memberCustomerId) {
      query.memberCustomerId = filters.memberCustomerId;
    }

    if (filters?.status) {
      query.status = filters.status;
    }

    return this.guardianStudentLinkModel
      .find(query)
      .sort({ createdAt: -1 })
      .lean<GuardianStudentLink[]>()
      .exec();
  }

  listByMemberCustomerId(memberCustomerId: string) {
    return this.list({
      memberCustomerId,
      status: 'active',
    });
  }

  async getOverview() {
    const items = await this.guardianStudentLinkModel
      .find()
      .sort({ createdAt: -1 })
      .lean<GuardianStudentLink[]>()
      .exec();

    return {
      totals: {
        links: items.length,
        active: items.filter((item) => item.status === 'active').length,
        inactive: items.filter((item) => item.status !== 'active').length,
      },
      items,
    };
  }

  async create(payload: CreateGuardianStudentLinkDto) {
    const existing = await this.guardianStudentLinkModel
      .findOne({
        studentId: payload.studentId,
        guardianId: payload.guardianId,
      })
      .lean<GuardianStudentLink | null>()
      .exec();

    if (existing) {
      return existing;
    }

    try {
      const link = await this.guardianStudentLinkModel.create({
        linkId: `GSL-${Date.now()}`,
        ...payload,
      });

      return link.toObject() as GuardianStudentLink;
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        const duplicate = await this.guardianStudentLinkModel
          .findOne({
            studentId: payload.studentId,
            guardianId: payload.guardianId,
          })
          .lean<GuardianStudentLink | null>()
          .exec();

        if (duplicate) {
          return duplicate;
        }
      }

      throw error;
    }
  }

  async update(linkId: string, payload: UpdateGuardianStudentLinkDto) {
    const updated = await this.guardianStudentLinkModel
      .findOneAndUpdate({ linkId }, payload, {
        new: true,
        runValidators: true,
      })
      .lean<GuardianStudentLink | null>()
      .exec();

    if (!updated) {
      throw new NotFoundException(`Guardian-student link ${linkId} was not found.`);
    }

    return updated;
  }
}
