import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';

import { GenerateInvoiceBatchDto } from './dto/generate-invoice-batch.dto';
import { SendInvoiceRemindersDto } from './dto/send-invoice-reminders.dto';
import { InvoicesService } from './invoices.service';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  list(
    @Query('schoolId') schoolId?: string,
    @Query('studentId') studentId?: string,
    @Query('grade') grade?: string,
  ) {
    return this.invoicesService.list(schoolId, studentId, grade);
  }

  @Get('overview')
  getOverview() {
    return this.invoicesService.getOverview();
  }

  @Post(':invoiceNo/send-reminder')
  sendReminder(@Param('invoiceNo') invoiceNo: string) {
    return this.invoicesService.sendReminder(invoiceNo);
  }

  @Post('send-reminders')
  sendReminders(@Body() payload: SendInvoiceRemindersDto) {
    return this.invoicesService.sendReminders(payload);
  }

  @Post('preview-batch')
  previewBatch(@Body() payload: GenerateInvoiceBatchDto) {
    return this.invoicesService.previewBatch(payload);
  }

  @Post('generate-batch')
  generateBatch(@Body() payload: GenerateInvoiceBatchDto) {
    return this.invoicesService.generateBatch(payload);
  }
}
