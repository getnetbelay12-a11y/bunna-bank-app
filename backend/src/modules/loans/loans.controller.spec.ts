import { LoansController } from './loans.controller';
import { LoansService } from './loans.service';

describe('LoansController', () => {
  let controller: LoansController;
  let loansService: jest.Mocked<LoansService>;

  beforeEach(() => {
    loansService = {
      submitLoanApplication: jest.fn(),
      attachLoanDocument: jest.fn(),
      getMyLoans: jest.fn(),
      getLoanDetail: jest.fn(),
    } as unknown as jest.Mocked<LoansService>;

    controller = new LoansController(loansService);
  });

  it('delegates loan submission to the service', async () => {
    const currentUser = { sub: 'member_1', role: 'member' } as never;
    const dto = {
      loanType: 'business',
      amount: 1000,
      interestRate: 10,
      termMonths: 12,
      purpose: 'capital',
    } as never;

    await controller.submitLoanApplication(currentUser, dto);

    expect(loansService.submitLoanApplication).toHaveBeenCalledWith(currentUser, dto);
  });

  it('delegates document attachment to the service', async () => {
    const currentUser = { sub: 'member_1', role: 'member' } as never;
    const dto = {
      documentType: 'id_card',
      originalFileName: 'id.pdf',
      storageKey: 'loan/id.pdf',
    } as never;

    await controller.attachLoanDocument(currentUser, 'loan_1', dto);

    expect(loansService.attachLoanDocument).toHaveBeenCalledWith(
      currentUser,
      'loan_1',
      dto,
    );
  });

  it('delegates my loans lookup to the service', async () => {
    const currentUser = { sub: 'member_1', role: 'member' } as never;

    await controller.getMyLoans(currentUser);

    expect(loansService.getMyLoans).toHaveBeenCalledWith(currentUser);
  });

  it('delegates loan detail lookup to the service', async () => {
    const currentUser = { sub: 'member_1', role: 'member' } as never;

    await controller.getLoanDetail(currentUser, 'loan_1');

    expect(loansService.getLoanDetail).toHaveBeenCalledWith(currentUser, 'loan_1');
  });
});
