import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, Max, Min } from 'class-validator';

export class BudgetDto {
  @ApiProperty()
  @IsInt()
  @Min(0)
  budgetMin!: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  budgetMax!: number;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  moveInDate?: string;

  @ApiProperty({ required: false })
  @IsInt()
  @Min(1)
  @Max(60)
  @IsOptional()
  stayDurationMonths?: number;
}
