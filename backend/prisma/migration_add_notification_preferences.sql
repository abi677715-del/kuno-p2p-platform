-- Add notification preferences JSON column to users table
ALTER TABLE users ADD COLUMN notification_preferences jsonb DEFAULT '{
  "emailTradeUpdates": true,
  "emailDisputeAlerts": true,
  "emailKycUpdates": true,
  "emailWithdrawalAlerts": true,
  "inAppTradeUpdates": true,
  "inAppDisputeAlerts": true,
  "smsUrgentAlerts": false,
  "smsDisputeNotifications": false
}'::jsonb;
