import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { AuthenticatedUser } from '../auth/interfaces';
import { AttachLoanDocumentDto, CreateLoanApplicationDto } from './dto';
import { LoansService } from './loans.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Post()
  submitLoanApplication(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateLoanApplicationDto,
  ) {
    return this.loansService.submitLoanApplication(currentUser, dto);
  }

  @Post(':loanId/documents')
  attachLoanDocument(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('loanId') loanId: string,
    @Body() dto: AttachLoanDocumentDto,
  ) {
    return this.loansService.attachLoanDocument(currentUser, loanId, dto);
  }

  @Get('my')
  getMyLoans(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.loansService.getMyLoans(currentUser);
  }

  @Get(':loanId')
  getLoanDetail(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('loanId') loanId: string,
  ) {
    return this.loansService.getLoanDetail(currentUser, loanId);
  }

  @Get(':loanId/timeline')
  getLoanTimeline(@Param('loanId') loanId: string) {
    return {
      loanId,
      timeline: [
        { status: 'submitted', title: 'Submitted' },
        { status: 'branch_review', title: 'Branch Review' },
        { status: 'district_review', title: 'District Review' },
        { status: 'head_office_review', title: 'Head Office Review' },
        { status: 'approved', title: 'Approved' },
        { status: 'rejected', title: 'Rejected' },
        { status: 'disbursed', title: 'Disbursed' },
      ],
    };
  }
}
