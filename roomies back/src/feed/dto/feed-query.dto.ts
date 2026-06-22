import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
} from 'class-validator';
import { GuestsPreference } from '@prisma/client';

export class FeedQueryDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  budgetMin?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  budgetMax?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  districtIds?: number[];

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  smokingOk?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  petsOk?: boolean;

  @IsOptional()
  @IsEnum(GuestsPreference)
  guestsPref?: GuestsPreference;
}
