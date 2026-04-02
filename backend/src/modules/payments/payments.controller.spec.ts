import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let paymentsService: jest.Mocked<PaymentsService>;

  beforeEach(() => {
    paymentsService = {
      createSchoolPayment: jest.fn(),
      getMySchoolPayments: jest.fn(),
      getSchoolPaymentSummary: jest.fn(),
    } as unknown as jest.Mocked<PaymentsService>;

    controller = new PaymentsController(paymentsService);
  });

  it('delegates school payment creation to the service', async () => {
    const currentUser = { sub: 'member_1', role: 'member' } as never;
    const dto = {
      accountId: 'acc_1',
      studentId: 'student_1',
      schoolName: 'School',
      amount: 1000,
      channel: 'mobile',
    } as never;

    await controller.createSchoolPayment(currentUser, dto);

    expect(paymentsService.createSchoolPayment).toHaveBeenCalledWith(
      currentUser,
      dto,
    );
  });

  it('delegates my school payments lookup to the service', async () => {
    const currentUser = { sub: 'member_1', role: 'member' } as never;

    await controller.getMySchoolPayments(currentUser);

    expect(paymentsService.getMySchoolPayments).toHaveBeenCalledWith(currentUser);
  });

  it('delegates summary lookup to the service', async () => {
    const currentUser = { sub: 'staff_1', role: 'admin' } as never;
    const query = { branchId: 'branch_1' };

    await controller.getSchoolPaymentSummary(currentUser, query);

    expect(paymentsService.getSchoolPaymentSummary).toHaveBeenCalledWith(
      currentUser,
      query,
    );
  });
});
