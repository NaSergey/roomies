import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
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

  // Приходит повторяющимся ключом: districtIds=1&districtIds=2. Парсер query
  // отдаёт массив только когда ключей несколько, а на одном районе — просто
  // строку, и @IsArray() валил бы запрос в 400. Поэтому сначала нормализуем в
  // массив, и только потом валидируем.
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null
      ? value
      : (Array.isArray(value) ? value : [value]).map(Number),
  )
  @IsArray()
  @ArrayMaxSize(20)
  @IsInt({ each: true })
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
