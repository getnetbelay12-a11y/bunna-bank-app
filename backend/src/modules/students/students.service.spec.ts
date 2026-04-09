import { ForbiddenException } from '@nestjs/common';

import { UserRole } from '../../common/enums';
import type { AuthenticatedUser } from '../auth/interfaces';
import { GuardianStudentLinksService } from '../guardian-student-links/guardian-student-links.service';
import { InstitutionsService } from '../institutions/institutions.service';

import { StudentsService } from './students.service';

describe('StudentsService', () => {
  function createService() {
    const persistedStudents: Array<Record<string, unknown>> = [];
    const studentModel = {
      countDocuments: jest.fn(() => ({
        exec: jest.fn().mockResolvedValue(persistedStudents.length),
      })),
      insertMany: jest.fn(async (items: Array<Record<string, unknown>>) => {
        persistedStudents.push(...items);
        return items;
      }),
      create: jest.fn(async (item: Record<string, unknown>) => {
        persistedStudents.push(item);
        return item;
      }),
      find: jest.fn(() => ({
        sort: jest.fn(() => ({
          lean: jest.fn(() => ({
            exec: jest.fn().mockResolvedValue([...persistedStudents]),
          })),
        })),
      })),
    };

    const guardianStudentLinksService = {
      listByMemberCustomerId: jest.fn().mockResolvedValue([]),
    } as unknown as GuardianStudentLinksService;

    const institutionsService = {
      getSchools: jest.fn().mockReturnValue([
        { id: 'school_blue_nile', name: 'Blue Nile Academy' },
        { id: 'school_tana', name: 'Lake Tana Preparatory School' },
      ]),
    } as unknown as InstitutionsService;

    return {
      service: new StudentsService(
        studentModel as never,
        guardianStudentLinksService,
        institutionsService,
      ),
      guardianStudentLinksService,
      studentModel,
    };
  }

  it('links students by parent account number when no explicit guardian link exists', async () => {
    const { service, guardianStudentLinksService } = createService();

    await service.create({
      schoolId: 'school_blue_nile',
      studentId: 'ST-ACC-9001',
      fullName: 'Account Match Student',
      guardianName: 'Parent Match',
      guardianPhone: '0999999999',
      parentAccountNumber: 'BUN-555001',
    });

    const currentUser: AuthenticatedUser = {
      sub: 'member-1',
      role: UserRole.MEMBER,
      customerId: 'BUN-555001',
      phone: '0911223344',
    };

    const result = await service.listLinkedToGuardian(currentUser);

    expect(guardianStudentLinksService.listByMemberCustomerId).toHaveBeenCalledWith(
      'BUN-555001',
    );
    expect(result.some((item) => item.studentId === 'ST-ACC-9001')).toBe(true);
  });

  it('hydrates the in-memory cache from Mongo-backed records on startup', async () => {
    const { service, studentModel } = createService();

    studentModel.countDocuments = jest.fn(() => ({
      exec: jest.fn().mockResolvedValue(1),
    }));
    studentModel.find = jest.fn(() => ({
      sort: jest.fn(() => ({
        lean: jest.fn(() => ({
          exec: jest.fn().mockResolvedValue([
            {
              schoolId: 'school_blue_nile',
              studentId: 'ST-PERSIST-0001',
              fullName: 'Persisted Student',
              grade: 'Grade 8',
              section: 'B',
              guardianName: 'Persisted Parent',
              guardianPhone: '0911000010',
              parentAccountNumber: 'BUN-100010',
              status: 'active',
            },
          ]),
        })),
      })),
    }));

    await service.onModuleInit();

    expect(
      service.listRegistry({ search: 'ST-PERSIST-0001' }).some((item) => item.studentId === 'ST-PERSIST-0001'),
    ).toBe(true);
  });

  it('rejects non-member access to linked students', async () => {
    const { service } = createService();

    expect(() =>
      service.listLinkedToGuardian({
        sub: 'staff-1',
        role: UserRole.ADMIN,
        customerId: 'BUN-100001',
      } as AuthenticatedUser),
    ).toThrow(ForbiddenException);
  });
});
