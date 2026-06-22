import { IsIn } from 'class-validator';

export class RespondAgreementDto {
  @IsIn(['accept', 'decline'])
  action!: 'accept' | 'decline';
}
