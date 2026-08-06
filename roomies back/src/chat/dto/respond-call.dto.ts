import { IsIn, IsISO8601, ValidateIf } from 'class-validator';

export class RespondCallDto {
  @IsIn(['accept', 'decline'])
  action!: 'accept' | 'decline';

  // Обязателен ТОЛЬКО при accept — раньше был просто @IsOptional, и accept без
  // confirmedTime доходил до `new Date(undefined!)` в chat.service (Invalid
  // Date), а Prisma падал на записи в DateTime-колонку необработанным
  // RangeError → голый 500 вместо чистого 400 на этапе валидации.
  @ValidateIf((o: RespondCallDto) => o.action === 'accept')
  @IsISO8601()
  confirmedTime?: string;
}
