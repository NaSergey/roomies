import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { AppFeedbackCategory } from '@prisma/client';

export class CreateFeedbackDto {
  @ApiProperty({ enum: AppFeedbackCategory })
  @IsEnum(AppFeedbackCategory)
  category!: AppFeedbackCategory;

  // Обрезаем пробелы ДО проверки длины: иначе сообщение из одних пробелов
  // проходит @MinLength и в базу падает пустой отзыв.
  @ApiProperty({ minLength: 5, maxLength: 2000 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  message!: string;

  // С какого экрана написали — «не работает» без этого нечем локализовать.
  @ApiProperty({ required: false, maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  screen?: string;
}
