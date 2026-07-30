import { IsString, MinLength } from 'class-validator';

export class ResolveAppealDto {
  @IsString()
  @MinLength(1)
  resolution: string;
}
