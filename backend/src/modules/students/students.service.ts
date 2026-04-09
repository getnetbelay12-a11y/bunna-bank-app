import {
  ConflictException,
  ForbiddenException,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { UserRole } from '../../common/enums';
import { AuthenticatedUser } from '../auth/interfaces';
import { GuardianStudentLinksService } from '../guardian-student-links/guardian-student-links.service';
import { InstitutionsService } from '../institutions/institutions.service';

import { CreateStudentDto } from './dto/create-student.dto';
import { ImportStudentsDto } from './dto/import-students.dto';
import { Student, StudentDocument } from './schemas/student.schema';
import { StudentRegistryQueryDto } from './dto/student-registry-query.dto';

type StudentRegistryItem = {
  schoolId: string;
  schoolName?: string;
  studentId: string;
  fullName: string;
  grade: string;
  section: string;
  guardianName: string;
  guardianPhone: string;
  parentAccountNumber: string;
  status: string;
};

const STUDENT_FIXTURES: StudentRegistryItem[] = [
  {
    schoolId: 'school_blue_nile',
    studentId: 'ST-1001',
    fullName: 'Bethel Alemu',
    grade: 'Grade 7',
    section: 'A',
    guardianName: 'Alemu Bekele',
    guardianPhone: '0911000001',
    parentAccountNumber: 'BUN-100001',
    status: 'active',
  },
  {
    schoolId: 'school_blue_nile',
    studentId: 'ST-1002',
    fullName: 'Mahlet Tadesse',
    grade: 'Grade 9',
    section: 'B',
    guardianName: 'Tadesse Worku',
    guardianPhone: '0911000007',
    parentAccountNumber: 'BUN-100007',
    status: 'active',
  },
  {
    schoolId: 'school_tana',
    studentId: 'ST-2001',
    fullName: 'Yohannes Kassahun',
    grade: 'Grade 5',
    section: 'C',
    guardianName: 'Kassahun Molla',
    guardianPhone: '0911000008',
    parentAccountNumber: 'BUN-100008',
    status: 'pending_billing',
  },
];

@Injectable()
export class StudentsService implements OnModuleInit {
  private readonly students = [...STUDENT_FIXTURES];

  constructor(
    @InjectModel(Student.name)
    private readonly studentModel: Model<StudentDocument>,
    private readonly guardianStudentLinksService: GuardianStudentLinksService,
    private readonly institutionsService: InstitutionsService,
  ) {}

  async onModuleInit() {
    await this.hydrateCacheFromDatabase();
  }

  list(schoolId?: string) {
    return this.listRegistry({ schoolId });
  }

  listRegistry(query: StudentRegistryQueryDto = {}) {
    const search = query.search?.trim().toLowerCase();

    return this.students
      .filter((item) => {
        if (query.schoolId && item.schoolId !== query.schoolId) {
          return false;
        }

        if (query.grade && item.grade !== query.grade) {
          return false;
        }

        if (query.section && item.section !== query.section) {
          return false;
        }

        if (query.status && item.status !== query.status) {
          return false;
        }

        if (
          search &&
          ![
            item.studentId,
            item.fullName,
            item.guardianName,
            item.guardianPhone,
            item.parentAccountNumber,
          ]
            .join(' ')
            .toLowerCase()
            .includes(search)
        ) {
          return false;
        }

        return true;
      })
      .map((item) => this.enrichStudent(item));
  }

  listLinkedToGuardian(currentUser: AuthenticatedUser) {
    if (
      currentUser.role !== UserRole.MEMBER &&
      currentUser.role !== UserRole.SHAREHOLDER_MEMBER
    ) {
      throw new ForbiddenException('Only member users can access linked students.');
    }

    if (!currentUser.customerId) {
      return [];
    }

    const linkedStudentIds = new Set<string>();
    const normalizedPhone = currentUser.phone?.trim();
    const normalizedCustomerId = currentUser.customerId.trim().toUpperCase();

    return this.guardianStudentLinksService
      .listByMemberCustomerId(currentUser.customerId)
      .then((links) => {
        for (const item of links) {
          linkedStudentIds.add(item.studentId);
        }

        return this.students
          .filter((item) => {
            if (linkedStudentIds.has(item.studentId)) {
              return true;
            }

            return Boolean(
              (normalizedPhone &&
                item.guardianPhone.trim() &&
                item.guardianPhone.trim() === normalizedPhone) ||
                (item.parentAccountNumber.trim() &&
                  item.parentAccountNumber.trim().toUpperCase() === normalizedCustomerId),
            );
          })
          .map((item) => this.enrichStudent(item));
      });
  }

  getOverview() {
    const students = this.students.length;
    const active = this.students.filter((item) => item.status === 'active').length;
    const pendingBilling = this.students.filter(
      (item) => item.status === 'pending_billing',
    ).length;

    return {
      totals: {
        students,
        active,
        pendingBilling,
        guardiansLinked: this.students.filter(
          (item) => item.guardianPhone || item.parentAccountNumber,
        ).length,
      },
      students: this.students.map((item) => this.enrichStudent(item)),
    };
  }

  async create(payload: CreateStudentDto) {
    const studentId = this.resolveStudentId(payload.studentId);
    if (this.students.some((item) => item.studentId === studentId)) {
      throw new ConflictException(`Student ID ${studentId} already exists.`);
    }

    const item: StudentRegistryItem = {
      schoolId: payload.schoolId,
      studentId,
      fullName: payload.fullName,
      grade: payload.grade ?? 'Unassigned',
      section: payload.section ?? 'Unassigned',
      guardianName: payload.guardianName ?? 'Pending guardian',
      guardianPhone: payload.guardianPhone ?? '',
      parentAccountNumber: payload.parentAccountNumber?.trim() ?? '',
      status: 'active',
    };

    this.students.unshift(item);
    await this.studentModel.create(item);
    return this.enrichStudent(item);
  }

  async importStudents(payload: ImportStudentsDto) {
    const seenStudentIds = new Set(this.students.map((item) => item.studentId));
    const created = payload.students.map((student) => {
      const studentId = this.resolveStudentId(student.studentId);
      if (seenStudentIds.has(studentId)) {
        throw new ConflictException(`Student ID ${studentId} already exists.`);
      }
      seenStudentIds.add(studentId);

      const item: StudentRegistryItem = {
        schoolId: payload.schoolId,
        studentId,
        fullName: student.fullName,
        grade: student.grade ?? 'Unassigned',
        section: student.section ?? 'Unassigned',
        guardianName: student.guardianName ?? 'Pending guardian',
        guardianPhone: student.guardianPhone ?? '',
        parentAccountNumber: student.parentAccountNumber?.trim() ?? '',
        status: 'active',
      };

      this.students.unshift(item);
      return this.enrichStudent(item);
    });

    if (created.length > 0) {
      await this.studentModel.insertMany(
        created.map((item) => this.toPersistenceShape(item)),
        { ordered: true },
      );
    }

    return {
      schoolId: payload.schoolId,
      importedCount: created.length,
      message: `Imported ${created.length} students into ${payload.schoolId}.`,
      items: created,
    };
  }

  private enrichStudent(item: StudentRegistryItem) {
    return {
      ...item,
      schoolName: this.getSchoolName(item.schoolId),
    };
  }

  private async hydrateCacheFromDatabase() {
    const existingCount = await this.studentModel.countDocuments().exec();

    if (existingCount === 0) {
      await this.studentModel.insertMany(
        STUDENT_FIXTURES.map((item) => this.toPersistenceShape(item)),
        { ordered: true },
      );
    }

    const persisted = await this.studentModel
      .find()
      .sort({ studentId: 1 })
      .lean<Array<StudentRegistryItem>>()
      .exec();

    this.students.splice(
      0,
      this.students.length,
      ...persisted.map((item) => ({
        schoolId: item.schoolId,
        schoolName: item.schoolName,
        studentId: item.studentId,
        fullName: item.fullName,
        grade: item.grade ?? 'Unassigned',
        section: item.section ?? 'Unassigned',
        guardianName: item.guardianName ?? 'Pending guardian',
        guardianPhone: item.guardianPhone ?? '',
        parentAccountNumber: item.parentAccountNumber ?? '',
        status: item.status ?? 'active',
      })),
    );
  }

  private toPersistenceShape(item: StudentRegistryItem) {
    return {
      schoolId: item.schoolId,
      studentId: item.studentId,
      fullName: item.fullName,
      grade: item.grade,
      section: item.section,
      guardianName: item.guardianName,
      guardianPhone: item.guardianPhone,
      parentAccountNumber: item.parentAccountNumber,
      status: item.status,
    };
  }

  private resolveStudentId(requestedStudentId?: string) {
    const trimmedStudentId = requestedStudentId?.trim();
    if (trimmedStudentId) {
      return trimmedStudentId;
    }

    return this.getNextStudentId();
  }

  private getNextStudentId() {
    const highestSequence = this.students.reduce((highest, item) => {
      const match = /^ST-(\d+)$/.exec(item.studentId.trim().toUpperCase());
      if (!match) {
        return highest;
      }

      return Math.max(highest, Number(match[1]));
    }, 0);

    return `ST-${String(highestSequence + 1).padStart(4, '0')}`;
  }

  private getSchoolName(schoolId: string) {
    return (
      this.institutionsService.getSchools().find((school) => school.id === schoolId)?.name ??
      schoolId
    );
  }
}
