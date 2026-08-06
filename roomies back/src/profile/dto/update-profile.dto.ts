import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { GuestsPreference } from '@prisma/client';

// Границы длины/размера синхронизированы с onboarding/dto/profile.dto.ts —
// PATCH /profile — тот же самый набор полей, что заполняется на шаге 5
// онбординга, и не должен быть валиден мягче: без лимитов клиент мог прислать
// мегабайтное имя или тысячи vibeTagIds/districtIds и раздуть строки/таблицы
// (VarChar(100)/(50) в схеме упадёт 500-й, а не отказом 400; для photoUrls
// без @IsUrl колонка text вообще не ограничена и принимала что угодно).
export class UpdateProfileDto {
  @ApiProperty({ required: false })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsArray()
  @ArrayMaxSize(9)
  @IsString({ each: true })
  @IsUrl({}, { each: true })
  @IsOptional()
  photoUrls?: string[];

  @ApiProperty({ required: false, type: [Number] })
  @IsArray()
  @ArrayMaxSize(5)
  @IsInt({ each: true })
  @IsOptional()
  vibeTagIds?: number[];

  @ApiProperty({ required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  budgetMin?: number;

  @ApiProperty({ required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  budgetMax?: number;

  @ApiProperty({ required: false, type: [Number] })
  @IsArray()
  @ArrayMaxSize(20)
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
