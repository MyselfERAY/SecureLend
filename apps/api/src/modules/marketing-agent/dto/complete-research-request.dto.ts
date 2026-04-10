import { IsString, IsUUID } from 'class-validator';

export class CompleteResearchRequestDto {
  @IsString()
  @IsUUID()
  resultReportId: string;
}
