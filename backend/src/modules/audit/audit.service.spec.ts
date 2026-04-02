import { AuditService } from './audit.service';
import { UserRole } from '../../common/enums';
import { Types } from 'mongoose';

describe('AuditService', () => {
  it('creates an audit log record', async () => {
    const id = new Types.ObjectId();
    const model = {
      create: jest.fn().mockResolvedValue({
        _id: id,
        actorId: new Types.ObjectId(),
        actorRole: UserRole.ADMIN,
        actionType: 'entity_updated',
        entityType: 'member',
        entityId: new Types.ObjectId(),
        before: { fullName: 'Old' },
        after: { fullName: 'New' },
      }),
    };

    const service = new AuditService(model as never);
    const result = await service.log({
      actorId: new Types.ObjectId().toString(),
      actorRole: UserRole.ADMIN,
      actionType: 'entity_updated',
      entityType: 'member',
      entityId: new Types.ObjectId().toString(),
      before: { fullName: 'Old' },
      after: { fullName: 'New' },
    });

    expect(model.create).toHaveBeenCalled();
    expect(result.id).toBe(id.toString());
  });

  it('lists audit logs by query filter', async () => {
    const actorId = new Types.ObjectId();
    const entityId = new Types.ObjectId();
    const model = {
      create: jest.fn(),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([
              {
                _id: new Types.ObjectId(),
                actorId,
                actorRole: UserRole.ADMIN,
                actionType: 'vote_submitted',
                entityType: 'vote',
                entityId,
                before: null,
                after: null,
              },
            ]),
          }),
        }),
      }),
    };

    const service = new AuditService(model as never);
    const result = await service.list({
      actorId: actorId.toString(),
      entityType: 'vote',
      entityId: entityId.toString(),
    });

    expect(model.find).toHaveBeenCalledWith({
      actorId,
      entityType: 'vote',
      entityId,
    });
    expect(result).toHaveLength(1);
  });
});
