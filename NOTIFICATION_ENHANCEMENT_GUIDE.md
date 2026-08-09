# Enhanced Notifications System

## Overview

This guide explains the new notification system enhancements added to the Kuno P2P platform.

## Features Added

### 1. Notification Preferences

Users can now control which notifications they receive via email, in-app, or SMS.

**Endpoints:**
```bash
# Get user's notification preferences
GET /notifications/preferences

# Update notification preferences
POST /notifications/preferences
Body: {
  "emailTradeUpdates": true,
  "emailDisputeAlerts": true,
  "emailKycUpdates": true,
  "emailWithdrawalAlerts": true,
  "inAppTradeUpdates": true,
  "inAppDisputeAlerts": true,
  "smsUrgentAlerts": false,
  "smsDisputeNotifications": false
}
```

### 2. Notification Templates

All notifications now use standardized templates with:
- Clear, emoji-enhanced subject lines
- Urgency levels (high/medium/low)
- HTML-formatted emails with consistent branding
- Call-to-action buttons
- Professional footer

**Template Types:**
- `TRADE_ESCROW_LOCKED` - When escrow is locked
- `TRADE_MARKED_PAID` - When buyer marks payment sent
- `TRADE_COMPLETED` - When trade completes
- `TRADE_CANCELLED` - When trade is cancelled
- `DISPUTE_OPENED` - When dispute is raised
- `DISPUTE_RESOLVED` - When dispute is resolved
- `KYC_APPROVED` - When KYC is approved
- `KYC_REJECTED` - When KYC is rejected
- `DEPOSIT_CONFIRMED` - When deposit is confirmed
- `DEPOSIT_REJECTED` - When deposit is rejected
- `WITHDRAWAL_CONFIRMED` - When withdrawal is sent
- `WITHDRAWAL_REJECTED` - When withdrawal is rejected

### 3. Admin Notifications

Admins now receive notifications for:
- New KYC submissions pending review
- New withdrawal requests requiring confirmation
- New disputes opened

**Services:**
- `notifyAdminsNewKycSubmission(userId, kycId)`
- `notifyAdminsNewWithdrawalRequest(userId, withdrawalId, amount)`
- `notifyAdminsNewDispute(tradeId, disputeId, raisedBy)`

### 4. SMS Notifications (Foundation)

Infrastructure added for SMS notifications:
- SMS preference flags for urgent alerts and disputes
- Phone number validation
- Ready for SMS provider integration (Twilio, AWS SNS, etc.)

## Implementation Guide

### Step 1: Update Database Schema

Add the notification preferences column:
```bash
cd backend
npm run prisma:migrate -- --name add_notification_preferences
# Or manually run the migration_add_notification_preferences.sql
```

### Step 2: Update Prisma Schema

Add to `backend/prisma/schema.prisma` in the `User` model:
```prisma
notificationPreferences  Json @default(
  "{\"emailTradeUpdates\": true, \"emailDisputeAlerts\": true, \"emailKycUpdates\": true, \"emailWithdrawalAlerts\": true, \"inAppTradeUpdates\": true, \"inAppDisputeAlerts\": true, \"smsUrgentAlerts\": false, \"smsDisputeNotifications\": false}"
)
```

### Step 3: Update App Module

Replace the notifications module import in `backend/src/app.module.ts`:

**Before:**
```typescript
import { NotificationsModule } from './notifications/notifications.module';
// ...
import { NotificationsModule }
```

**After:**
```typescript
import { NotificationsModuleEnhanced } from './notifications/notifications.module.enhanced';
// ...
import { NotificationsModuleEnhanced }
```

### Step 4: Update Services to Use Enhanced Notifications

In any service that creates notifications (e.g., `trades.service.ts`), update the import:

**Before:**
```typescript
import { NotificationsService } from '../notifications/notifications.service';
private notificationsService: NotificationsService;
```

**After:**
```typescript
import { NotificationsServiceEnhanced } from '../notifications/notifications.service.enhanced';
private notificationsService: NotificationsServiceEnhanced;
```

### Step 5: Update Mail Service

Update `backend/src/mail/mail.module.ts` to export the enhanced service:

```typescript
import { Module } from '@nestjs/common';
import { MailServiceEnhanced } from './mail.service.enhanced';

@Module({
  providers: [MailServiceEnhanced],
  exports: [MailServiceEnhanced],
})
export class MailModule {}
```

### Step 6: Integrate Admin Notifications in Services

**In KYC service:**
```typescript
import { NotificationAdminService } from '../notifications/notification-admin.service';

// When KYC is submitted
await this.notificationAdminService.notifyAdminsNewKycSubmission(userId, kycId);
```

**In Wallet service:**
```typescript
// When withdrawal is requested
await this.notificationAdminService.notifyAdminsNewWithdrawalRequest(userId, withdrawalId, amount);
```

**In Trades service:**
```typescript
// When dispute is raised
await this.notificationAdminService.notifyAdminsNewDispute(tradeId, disputeId, userId);
```

## Frontend Integration

### Get User Preferences

```typescript
const response = await fetch('http://localhost:4000/notifications/preferences', {
  method: 'GET',
  headers: { Authorization: `Bearer ${token}` }
});
const preferences = await response.json();
```

### Update Preferences

```typescript
const response = await fetch('http://localhost:4000/notifications/preferences', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    emailTradeUpdates: false,  // Disable email trade updates
    smsUrgentAlerts: true      // Enable SMS for urgent alerts
  })
});
const updated = await response.json();
```

### Create Settings Page

Add a new frontend page at `frontend/app/settings/notifications.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';

export default function NotificationSettings() {
  const [prefs, setPrefs] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrefs = async () => {
      const res = await fetch('/api/notifications/preferences');
      setPrefs(await res.json());
      setLoading(false);
    };
    fetchPrefs();
  }, []);

  const handleToggle = async (key: string) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    const res = await fetch('/api/notifications/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
    setPrefs(await res.json());
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Notification Settings</h1>

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Email Notifications</h2>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={prefs.emailTradeUpdates}
                onChange={() => handleToggle('emailTradeUpdates')}
              />
              <span className="ml-2">Trade Updates</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={prefs.emailDisputeAlerts}
                onChange={() => handleToggle('emailDisputeAlerts')}
              />
              <span className="ml-2">Dispute Alerts</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={prefs.emailKycUpdates}
                onChange={() => handleToggle('emailKycUpdates')}
              />
              <span className="ml-2">KYC Updates</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={prefs.emailWithdrawalAlerts}
                onChange={() => handleToggle('emailWithdrawalAlerts')}
              />
              <span className="ml-2">Withdrawal Alerts</span>
            </label>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">In-App Notifications</h2>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={prefs.inAppTradeUpdates}
                onChange={() => handleToggle('inAppTradeUpdates')}
              />
              <span className="ml-2">Trade Updates</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={prefs.inAppDisputeAlerts}
                onChange={() => handleToggle('inAppDisputeAlerts')}
              />
              <span className="ml-2">Dispute Alerts</span>
            </label>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">SMS Notifications</h2>
          <p className="text-gray-600 mb-4">Requires phone number verification</p>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={prefs.smsUrgentAlerts}
                onChange={() => handleToggle('smsUrgentAlerts')}
              />
              <span className="ml-2">Urgent Alerts</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={prefs.smsDisputeNotifications}
                onChange={() => handleToggle('smsDisputeNotifications')}
              />
              <span className="ml-2">Dispute Notifications</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## Testing

### Test Email Notifications

1. Create a trade and mark it as paid
2. Check the buyer's email for the formatted notification
3. Verify the CTA button links to the correct trade

### Test Preferences

1. GET `/notifications/preferences` to view defaults
2. POST `/notifications/preferences` with updated values
3. Create a trade and verify email is not sent if disabled

### Test Admin Notifications

1. Submit a new KYC (promote to admin first)
2. Check admin's in-app notifications
3. Verify admin received email alert

## Next Steps

1. **SMS Provider Integration** - Connect to Twilio or AWS SNS
2. **Push Notifications** - Add Firebase Cloud Messaging (FCM) or similar
3. **Notification History** - Add ability to view sent notifications
4. **Notification Digest** - Daily/weekly digest emails
5. **Do Not Disturb** - Time-based quiet hours
6. **Advanced Filtering** - Notification rules by user/amount/category

## Troubleshooting

### Emails not sending
- Verify `RESEND_API_KEY` environment variable
- Check `MAIL_FROM` is set correctly
- Check `FRONTEND_URL` for correct URLs in emails

### Preferences not saving
- Ensure database migration was run
- Check user ID is correct
- Verify JWT token is valid

### SMS not configured yet
- SMS infrastructure is ready but requires provider setup
- Contact support for SMS provider setup instructions
