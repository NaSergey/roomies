import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class QuizAnswerDto {
  @IsInt()
  @Min(1)
  @Max(10)
  questionId!: number;

  @IsString()
  optionCode!: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  answerValue!: number;
}

export class QuizDto {
  @ApiProperty({ type: [QuizAnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerDto)
  answers!: QuizAnswerDto[];
}
