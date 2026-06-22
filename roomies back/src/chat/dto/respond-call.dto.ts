import { IsIn, IsISO8601, IsOptional } from 'class-validator';

export class RespondCallDto {
  @IsIn(['accept', 'decline'])
  action!: 'accept' | 'decline';

  @IsOptional()
  @IsISO8601()
  confirmedTime?: string;
}
