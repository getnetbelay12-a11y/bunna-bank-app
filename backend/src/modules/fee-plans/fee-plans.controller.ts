import { Body, Controller, Get, Post, Query } from '@nestjs/common';

import { CreateFeePlanDto } from './dto/create-fee-plan.dto';
import { FeePlansService } from './fee-plans.service';

@Controller('fee-plans')
export class FeePlansController {
  constructor(private readonly feePlansService: FeePlansService) {}

  @Get()
  list(@Query('schoolId') schoolId?: string) {
    return this.feePlansService.list(schoolId);
  }

  @Get('overview')
  getOverview() {
    return this.feePlansService.getOverview();
  }

  @Post()
  create(@Body() payload: CreateFeePlanDto) {
    return this.feePlansService.create(payload);
  }
}
