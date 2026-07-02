import { IsOptional, IsUUID } from 'class-validator';

export class AssignPromoDto {
  @IsUUID('4')
  templateId!: string;

  @IsUUID('4')
  userId!: string;

  @IsOptional()
  @IsUUID('4')
  contractId?: string;
}
