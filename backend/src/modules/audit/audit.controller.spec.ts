import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';

describe('AuditController', () => {
  it('delegates list query lookup', async () => {
    const service = {
      list: jest.fn(),
      listByEntity: jest.fn(),
      listByActor: jest.fn(),
    };
    const controller = new AuditController(service as never);
    await controller.list({ actorId: 'actor_1' });
    expect(service.list).toHaveBeenCalledWith({ actorId: 'actor_1' });
  });

  it('delegates entity lookup', async () => {
    const service = {
      list: jest.fn(),
      listByEntity: jest.fn(),
      listByActor: jest.fn(),
    };
    const controller = new AuditController(service as never);
    await controller.listByEntity('loan', 'id1');
    expect(service.listByEntity).toHaveBeenCalledWith('loan', 'id1');
  });
});
