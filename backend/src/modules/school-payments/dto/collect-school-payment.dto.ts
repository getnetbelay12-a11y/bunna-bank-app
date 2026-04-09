export class CollectSchoolPaymentDto {
  invoiceNo!: string;
  amount!: number;
  channel?: string;
  payerName?: string;
  payerPhone?: string;
}
