import { GuardianStudentLinksService } from './guardian-student-links.service';

describe('GuardianStudentLinksService', () => {
  function createService() {
    const existingLinks: Array<Record<string, string>> = [];
    const guardianStudentLinkModel = {
      countDocuments: jest.fn().mockResolvedValue(1),
      insertMany: jest.fn(),
      find: jest.fn(() => ({
        sort: jest.fn(() => ({
          lean: jest.fn(() => ({
            exec: jest.fn().mockResolvedValue(existingLinks),
          })),
        })),
      })),
      findOne: jest.fn((query: Record<string, string>) => ({
        lean: jest.fn(() => ({
          exec: jest.fn().mockResolvedValue(
            existingLinks.find(
              (item) =>
                item.studentId === query.studentId &&
                item.guardianId === query.guardianId,
            ) ?? null,
          ),
        })),
      })),
      create: jest.fn(async (payload: Record<string, string>) => {
        const created = { ...payload };
        existingLinks.push(created);
        return {
          toObject: () => created,
        };
      }),
    };

    return {
      service: new GuardianStudentLinksService(guardianStudentLinkModel as never),
      guardianStudentLinkModel,
      existingLinks,
    };
  }

  it('returns the existing link when the same student and guardian are linked again', async () => {
    const { service, guardianStudentLinkModel, existingLinks } = createService();
    existingLinks.push({
      linkId: 'GSL-1001',
      studentId: 'ST-9001',
      guardianId: 'GDN-1004',
      memberCustomerId: 'BUN-100001',
      relationship: 'parent',
      status: 'active',
    });

    const result = await service.create({
      studentId: 'ST-9001',
      guardianId: 'GDN-1004',
      memberCustomerId: 'BUN-100001',
      relationship: 'parent',
      status: 'active',
    });

    expect(result.linkId).toBe('GSL-1001');
    expect(guardianStudentLinkModel.create).not.toHaveBeenCalled();
  });
});
