import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ProfileDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ required: false, type: [String] })
  @IsArray()
  @ArrayMaxSize(9)
  @IsString({ each: true })
  @IsUrl({}, { each: true })
  @IsOptional()
  photoUrls!: string[];

  @ApiProperty({ type: [Number] })
  @IsArray()
  @IsInt({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  vibeTagIds!: number[];
}
