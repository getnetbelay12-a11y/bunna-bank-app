import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class SendInvoiceRemindersDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  invoiceNos!: string[];
}
