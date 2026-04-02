import { LoanWorkflowController } from './loan-workflow.controller';
import { LoanWorkflowService } from './loan-workflow.service';

describe('LoanWorkflowController', () => {
  let controller: LoanWorkflowController;
  let service: jest.Mocked<LoanWorkflowService>;

  beforeEach(() => {
    service = {
      processAction: jest.fn(),
    } as unknown as jest.Mocked<LoanWorkflowService>;

    controller = new LoanWorkflowController(service);
  });

  it('delegates workflow actions to the service', async () => {
    const currentUser = { sub: 'staff_1', role: 'branch_manager' } as never;
    const dto = { action: 'approve' } as never;

    await controller.processAction(currentUser, 'loan_1', dto);

    expect(service.processAction).toHaveBeenCalledWith(currentUser, 'loan_1', dto);
  });
});
