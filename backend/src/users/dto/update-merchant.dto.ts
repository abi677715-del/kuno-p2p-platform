import { IsBoolean } from 'class-validator';

export class UpdateMerchantDto {
  @IsBoolean()
  isMerchant: boolean;
}
