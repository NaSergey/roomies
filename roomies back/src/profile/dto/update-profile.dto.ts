import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { GuestsPreference } from '@prisma/client';

export class UpdateProfileDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  photoUrls?: string[];

  @ApiProperty({ required: false, type: [Number] })
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  vibeTagIds?: number[];

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  budgetMin?: number;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  budgetMax?: number;

  @ApiProperty({ required: false, type: [Number] })
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  districtIds?: number[];

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  smokingOk?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  petsOk?: boolean;

  @ApiProperty({ required: false, enum: GuestsPreference })
  @IsEnum(GuestsPreference)
  @IsOptional()
  guestsPref?: GuestsPreference;
}
