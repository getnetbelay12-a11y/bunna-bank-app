import { IsNotEmpty, IsString } from 'class-validator';

export class ReportSecurityReviewMetricsContractIssueDto {
  @IsString()
  @IsNotEmpty()
  detectedContractVersion!: string;

  @IsString()
  @IsNotEmpty()
  supportedContractVersion!: string;

  @IsString()
  @IsNotEmpty()
  source!: string;
}
