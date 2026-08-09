import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationPreferencesDto {
  @IsOptional()
  @IsBoolean()
  emailTradeUpdates?: boolean;

  @IsOptional()
  @IsBoolean()
  emailDisputeAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  emailKycUpdates?: boolean;

  @IsOptional()
  @IsBoolean()
  emailWithdrawalAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  inAppTradeUpdates?: boolean;

  @IsOptional()
  @IsBoolean()
  inAppDisputeAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  smsUrgentAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  smsDisputeNotifications?: boolean;
}
