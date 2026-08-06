import { Type } from 'class-transformer';
import { IsInt, IsOptional, Matches, Max, Min } from 'class-validator';

export class GetMessagesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 30;

  // Курсор — сериализованный BigInt (Message.id). Строго цифры: `before`
  // раньше шёл в BigInt(before) без проверки — нечисловая строка кидала
  // необработанный SyntaxError и превращала 400 в голый 500.
  @IsOptional()
  @Matches(/^\d+$/, { message: 'before must be a numeric string' })
  before?: string;
}
