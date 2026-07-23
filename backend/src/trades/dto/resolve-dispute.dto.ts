import { IsEnum, IsString, MinLength } from 'class-validator';

export enum DisputeOutcome {
  RELEASE_TO_BUYER = 'RELEASE_TO_BUYER',
  REFUND_TO_SELLER = 'REFUND_TO_SELLER',
}

export class ResolveDisputeDto {
  @IsEnum(DisputeOutcome)
  outcome: DisputeOutcome;

  @IsString()
  @MinLength(5, { message: 'Give a short note on how this was resolved' })
  resolution: string;
}
