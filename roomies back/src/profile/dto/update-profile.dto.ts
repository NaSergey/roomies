import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { GuestsPreference } from '@prisma/client';
import { IsPhotoUrl } from '../../common/is-photo-url.validator';

export class UpdateProfileDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsArray()
  @ArrayMaxSize(5)
  @IsPhotoUrl({ each: true })
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

  // Собственное поведение, отдельно от терпимости выше — см. комментарий у
  // smokes/hasPets в schema.prisma.
  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  smokes?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  hasPets?: boolean;

  @ApiProperty({ required: false, enum: GuestsPreference })
  @IsEnum(GuestsPreference)
  @IsOptional()
  guestsPref?: GuestsPreference;
}
