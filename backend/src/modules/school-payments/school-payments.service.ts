import { Injectable } from '@nestjs/common';

import { InvoicesService } from '../invoices/invoices.service';
import { CollectSchoolPaymentDto } from './dto/collect-school-payment.dto';

const SCHOOL_PAYMENT_FIXTURES = [
  {
    receiptNo: 'RCP-2026-0001',
    schoolId: 'school_blue_nile',
    schoolName: 'Blue Nile Academy',
    studentId: 'ST-1001',
    amount: 1500,
    channel: 'mobile',
    status: 'successful',
    reconciliationStatus: 'matched',
    recordedAt: '2026-03-08T10:15:00.000Z',
  },
  {
    receiptNo: 'RCP-2026-0002',
    schoolId: 'school_blue_nile',
    schoolName: 'Blue Nile Academy',
    studentId: 'ST-1002',
    amount: 9500,
    channel: 'branch',
    status: 'successful',
    reconciliationStatus: 'matched',
    recordedAt: '2026-03-09T08:25:00.000Z',
  },
  {
    receiptNo: 'RCP-2026-0101',
    schoolId: 'school_tana',
    schoolName: 'Lake Tana Preparatory School',
    studentId: 'ST-2001',
    amount: 1200,
    channel: 'mobile',
    status: 'pending',
    reconciliationStatus: 'awaiting_settlement',
    recordedAt: '2026-03-10T11:05:00.000Z',
  },
];

@Injectable()
export class SchoolPaymentsService {
  private readonly payments = SCHOOL_PAYMENT_FIXTURES.map((item) => ({ ...item }));

  constructor(private readonly invoicesService: InvoicesService) {}

  list(filters?: { schoolId?: string; studentId?: string }) {
    return this.payments.filter((item) => {
      if (filters?.schoolId && item.schoolId !== filters.schoolId) {
        return false;
      }

      if (filters?.studentId && item.studentId !== filters.studentId) {
        return false;
      }

      return true;
    });
  }

  getOverview() {
    const generatedAt =
      this.payments
        .map((item) => item.recordedAt)
        .sort()
        .at(-1) ?? new Date().toISOString();
    const matchedPayments = this.payments.filter(
      (item) => item.reconciliationStatus === 'matched',
    );
    const awaitingSettlementPayments = this.payments.filter(
      (item) => item.reconciliationStatus === 'awaiting_settlement',
    );

    return {
      totals: {
        receipts: this.payments.length,
        successful: this.payments.filter((item) => item.status === 'successful')
          .length,
        pendingSettlement: this.payments.filter(
          (item) => item.reconciliationStatus !== 'matched',
        ).length,
        amount: this.payments.reduce((sum, item) => sum + item.amount, 0),
      },
      collectionSummary: {
        generatedAt,
        receipts: this.payments.length,
        successful: this.payments.filter((item) => item.status === 'successful')
          .length,
        pendingSettlement: awaitingSettlementPayments.length,
        totalAmount: this.payments.reduce((sum, item) => sum + item.amount, 0),
        matchedAmount: matchedPayments.reduce((sum, item) => sum + item.amount, 0),
        awaitingSettlementAmount: awaitingSettlementPayments.reduce(
          (sum, item) => sum + item.amount,
          0,
        ),
        aging: [
          this.buildAgingBucket('0-1 days', generatedAt, 0, 1),
          this.buildAgingBucket('2-3 days', generatedAt, 2, 3),
          this.buildAgingBucket('4+ days', generatedAt, 4, Number.POSITIVE_INFINITY),
        ],
      },
      schoolSettlements: this.buildSchoolSettlements(),
      items: this.payments,
    };
  }

  private buildAgingBucket(
    label: string,
    generatedAt: string,
    minimumDays: number,
    maximumDays: number,
  ) {
    const anchor = new Date(generatedAt).getTime();
    const matchingItems = this.payments.filter((item) => {
      if (item.reconciliationStatus !== 'awaiting_settlement') {
        return false;
      }

      const ageInDays = Math.max(
        0,
        Math.floor((anchor - new Date(item.recordedAt).getTime()) / (1000 * 60 * 60 * 24)),
      );

      return ageInDays >= minimumDays && ageInDays <= maximumDays;
    });

    return {
      label,
      count: matchingItems.length,
      amount: matchingItems.reduce((sum, item) => sum + item.amount, 0),
    };
  }

  private buildSchoolSettlements() {
    return Array.from(
      this.payments.reduce<
        Map<
          string,
          {
            schoolId: string;
            schoolName: string;
            receipts: number;
            totalAmount: number;
            matchedAmount: number;
            awaitingSettlementAmount: number;
            pendingSettlement: number;
            lastRecordedAt?: string;
          }
        >
      >((accumulator, item) => {
        const current = accumulator.get(item.schoolId) ?? {
          schoolId: item.schoolId,
          schoolName: item.schoolName,
          receipts: 0,
          totalAmount: 0,
          matchedAmount: 0,
          awaitingSettlementAmount: 0,
          pendingSettlement: 0,
          lastRecordedAt: item.recordedAt,
        };

        current.receipts += 1;
        current.totalAmount += item.amount;
        current.lastRecordedAt =
          !current.lastRecordedAt || current.lastRecordedAt < item.recordedAt
            ? item.recordedAt
            : current.lastRecordedAt;

        if (item.reconciliationStatus === 'matched') {
          current.matchedAmount += item.amount;
        } else if (item.reconciliationStatus === 'awaiting_settlement') {
          current.awaitingSettlementAmount += item.amount;
          current.pendingSettlement += 1;
        }

        accumulator.set(item.schoolId, current);
        return accumulator;
      }, new Map())
        .values(),
    ).sort((left, right) => right.awaitingSettlementAmount - left.awaitingSettlementAmount);
  }

  collect(payload: CollectSchoolPaymentDto) {
    const appliedInvoice = this.invoicesService.applyPayment(
      payload.invoiceNo,
      payload.amount,
    );

    if (!appliedInvoice) {
      return {
        status: 'missing_invoice',
        message: `Invoice ${payload.invoiceNo} was not found.`,
      };
    }

    const receiptNo = `RCP-${new Date().getFullYear()}-${String(this.payments.length + 1).padStart(4, '0')}`;
    const receipt = {
      receiptNo,
      schoolId: appliedInvoice.schoolId,
      schoolName: appliedInvoice.schoolName,
      studentId: appliedInvoice.studentId,
      amount: appliedInvoice.appliedAmount,
      channel: payload.channel ?? 'mobile',
      status: 'successful',
      reconciliationStatus:
        (payload.channel ?? 'mobile') === 'branch' ? 'matched' : 'awaiting_settlement',
      recordedAt: new Date().toISOString(),
    };

    this.payments.unshift(receipt);

    return {
      status: 'successful',
      message: `Payment of ETB ${appliedInvoice.appliedAmount.toLocaleString()} recorded for ${appliedInvoice.studentName}.`,
      receiptNo,
      invoiceNo: payload.invoiceNo,
      studentId: appliedInvoice.studentId,
      amount: appliedInvoice.appliedAmount,
      remainingBalance: appliedInvoice.balance,
      receipt,
    };
  }

  recordMemberPayment(params: {
    studentId: string;
    schoolName: string;
    amount: number;
    channel?: string;
  }) {
    const invoice = this.invoicesService
      .list(undefined, params.studentId)
      .find((item) => item.status === 'open' || item.status === 'partially_paid');

    if (!invoice) {
      return null;
    }

    return this.collect({
      invoiceNo: invoice.invoiceNo,
      amount: params.amount,
      channel: params.channel ?? 'mobile',
    });
  }
}
