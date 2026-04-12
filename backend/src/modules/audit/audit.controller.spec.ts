import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';

describe('AuditController', () => {
  it('delegates list query lookup', async () => {
    const service = {
      list: jest.fn(),
      listOnboardingReviewDecisions: jest.fn(),
      exportOnboardingReviewDecisionsCsv: jest.fn(),
      verifyAuditLog: jest.fn(),
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
      listOnboardingReviewDecisions: jest.fn(),
      exportOnboardingReviewDecisionsCsv: jest.fn(),
      verifyAuditLog: jest.fn(),
      listByEntity: jest.fn(),
      listByActor: jest.fn(),
    };
    const controller = new AuditController(service as never);
    await controller.listByEntity('loan', 'id1');
    expect(service.listByEntity).toHaveBeenCalledWith('loan', 'id1');
  });

  it('delegates onboarding review decision lookup', async () => {
    const service = {
      list: jest.fn(),
      listOnboardingReviewDecisions: jest.fn(),
      exportOnboardingReviewDecisionsCsv: jest.fn(),
      verifyAuditLog: jest.fn(),
      listByEntity: jest.fn(),
      listByActor: jest.fn(),
    };
    const controller = new AuditController(service as never);
    await controller.listOnboardingReviewDecisions({ status: 'approved', currentOnly: 'true' });
    expect(service.listOnboardingReviewDecisions).toHaveBeenCalledWith({
      status: 'approved',
      currentOnly: 'true',
    });
  });

  it('delegates onboarding review export', async () => {
    const service = {
      list: jest.fn(),
      listOnboardingReviewDecisions: jest.fn(),
      exportOnboardingReviewDecisionsCsv: jest.fn().mockResolvedValue('csv-data'),
      verifyAuditLog: jest.fn(),
      listByEntity: jest.fn(),
      listByActor: jest.fn(),
    };
    const response = { setHeader: jest.fn() };
    const controller = new AuditController(service as never);
    await controller.exportOnboardingReviewDecisions({ status: 'approved' }, response as never);
    expect(service.exportOnboardingReviewDecisionsCsv).toHaveBeenCalledWith({
      status: 'approved',
    });
    expect(response.setHeader).toHaveBeenCalled();
  });

  it('delegates audit digest verification', async () => {
    const service = {
      list: jest.fn(),
      listOnboardingReviewDecisions: jest.fn(),
      exportOnboardingReviewDecisionsCsv: jest.fn(),
      verifyAuditLog: jest.fn(),
      listByEntity: jest.fn(),
      listByActor: jest.fn(),
    };
    const controller = new AuditController(service as never);
    await controller.verifyAuditLog('audit_1');
    expect(service.verifyAuditLog).toHaveBeenCalledWith('audit_1');
  });
});
