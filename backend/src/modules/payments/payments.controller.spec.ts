import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let paymentsService: jest.Mocked<PaymentsService>;

  beforeEach(() => {
    paymentsService = {
      createSchoolPayment: jest.fn(),
      createQrPayment: jest.fn(),
      getMySchoolPayments: jest.fn(),
      getMyPaymentReceipts: jest.fn(),
      getMyPaymentActivity: jest.fn(),
      getManagerPaymentReceipts: jest.fn(),
      getManagerPaymentActivity: jest.fn(),
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

  it('delegates qr payment creation to the service', async () => {
    const currentUser = { sub: 'member_1', role: 'member' } as never;
    const dto = {
      accountId: 'acc_1',
      qrPayload: 'merchant:aba-001',
      merchantName: 'ABa Merchant',
      amount: 250,
    } as never;

    await controller.createQrPayment(currentUser, dto);

    expect(paymentsService.createQrPayment).toHaveBeenCalledWith(currentUser, dto);
  });

  it('delegates my school payments lookup to the service', async () => {
    const currentUser = { sub: 'member_1', role: 'member' } as never;

    await controller.getMySchoolPayments(currentUser);

    expect(paymentsService.getMySchoolPayments).toHaveBeenCalledWith(currentUser);
  });

  it('delegates my payment receipts lookup to the service', async () => {
    const currentUser = { sub: 'member_1', role: 'member' } as never;

    await controller.getMyPaymentReceipts(currentUser);

    expect(paymentsService.getMyPaymentReceipts).toHaveBeenCalledWith(currentUser);
  });

  it('delegates my payment activity lookup to the service', async () => {
    const currentUser = { sub: 'member_1', role: 'member' } as never;

    await controller.getMyPaymentActivity(currentUser);

    expect(paymentsService.getMyPaymentActivity).toHaveBeenCalledWith(currentUser);
  });

  it('delegates manager receipt lookup to the service', async () => {
    const currentUser = { sub: 'staff_1', role: 'admin' } as never;

    await controller.getManagerPaymentReceipts(currentUser, 'member_1');

    expect(paymentsService.getManagerPaymentReceipts).toHaveBeenCalledWith(
      currentUser,
      'member_1',
    );
  });

  it('delegates manager payment activity lookup to the service', async () => {
    const currentUser = { sub: 'staff_1', role: 'admin' } as never;

    await controller.getManagerPaymentActivity(currentUser);

    expect(paymentsService.getManagerPaymentActivity).toHaveBeenCalledWith(currentUser);
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
