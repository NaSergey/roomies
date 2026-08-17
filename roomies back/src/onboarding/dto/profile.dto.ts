import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsPhotoUrl } from '../../common/is-photo-url.validator';

export class ProfileDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ required: false, type: [String] })
  @IsArray()
  @ArrayMaxSize(5)
  @IsPhotoUrl({ each: true })
  @IsOptional()
  photoUrls!: string[];

  @ApiProperty({ type: [Number] })
  @IsArray()
  @IsInt({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  vibeTagIds!: number[];
}
