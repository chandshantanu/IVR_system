# Phone Number Filtering for Metrics - Implementation Guide

**Date:** 2026-01-17
**Feature:** Phone Number-based Metrics Filtering

---

## Overview

This feature allows users to filter all metrics and analytics by specific phone numbers (Exophones). This is essential for businesses with multiple phone lines to track performance separately for each number.

---

## Features Implemented

### ✅ Backend Components

1. **Database Schema** - `PhoneNumber` model in Prisma
2. **Phone Numbers Service** - CRUD operations for phone numbers
3. **Phone Numbers Controller** - REST API endpoints
4. **Analytics Service Updates** - Phone number filtering support
5. **Auto-Discovery** - Automatically discover phone numbers from call logs

### ✅ Frontend Components

1. **PhoneNumberSelector** - Dropdown component for selecting phone numbers
2. **Dashboard Integration** - Phone number filter in dashboard
3. **API Client** - Phone numbers API functions

---

## Database Schema

### PhoneNumber Model

```prisma
model PhoneNumber {
  id           Int      @id @default(autoincrement())
  number       String   @unique // E.164 format: +919876543210
  friendlyName String?  // Display name: "Customer Support Line"
  type         String   @default("exophone") // exophone, sip, landline
  isActive     Boolean  @default(true)
  isPrimary    Boolean  @default(false) // Primary number for metrics
  capabilities Json? // {"voice": true, "sms": true, "recording": true}
  metadata     Json? // {"department": "sales", "region": "mumbai"}
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([number])
  @@index([isActive])
  @@index([isPrimary])
  @@map("phone_numbers")
}
```

### Fields Explanation

- **number**: Phone number in E.164 format (e.g., `+919876543210`)
- **friendlyName**: Human-readable name (e.g., "Customer Support - Mumbai")
- **type**: Phone number type (exophone, sip, landline)
- **isActive**: Whether the number is currently active
- **isPrimary**: Primary number (auto-selected in filters)
- **capabilities**: JSON object defining what the number can do
- **metadata**: Additional custom data (department, region, etc.)

---

## API Endpoints

### Base URL: `/api/phone-numbers`

**Authentication:** All endpoints require JWT token

### 1. Get All Phone Numbers

```http
GET /api/phone-numbers
Query Parameters:
  - includeInactive: boolean (default: false)
```

**Response:**
```json
[
  {
    "id": 1,
    "number": "+919876543210",
    "friendlyName": "Customer Support - Mumbai",
    "type": "exophone",
    "isActive": true,
    "isPrimary": true,
    "capabilities": {"voice": true, "sms": true},
    "metadata": {"department": "support", "region": "mumbai"},
    "createdAt": "2026-01-17T00:00:00Z",
    "updatedAt": "2026-01-17T00:00:00Z"
  }
]
```

### 2. Get Phone Numbers for Dropdown

```http
GET /api/phone-numbers/dropdown
```

**Response:**
```json
[
  {
    "id": 1,
    "number": "+919876543210",
    "label": "Customer Support - Mumbai",
    "isPrimary": true
  },
  {
    "id": 2,
    "number": "+919876543211",
    "label": "Sales - Delhi",
    "isPrimary": false
  }
]
```

### 3. Get Phone Number by ID

```http
GET /api/phone-numbers/:id
```

### 4. Create/Update Phone Number

```http
POST /api/phone-numbers
Content-Type: application/json

{
  "number": "+919876543210",
  "friendlyName": "Customer Support - Mumbai",
  "type": "exophone",
  "isActive": true,
  "isPrimary": false,
  "capabilities": {"voice": true, "sms": true, "recording": true},
  "metadata": {"department": "support", "region": "mumbai"}
}
```

### 5. Update Phone Number

```http
PUT /api/phone-numbers/:id
Content-Type: application/json

{
  "friendlyName": "Updated Name",
  "isPrimary": true
}
```

### 6. Delete Phone Number

```http
DELETE /api/phone-numbers/:id
```

### 7. Auto-Discover Phone Numbers

```http
POST /api/phone-numbers/discover
```

Scans call logs and automatically creates phone number entries for any numbers found.

**Response:**
```json
{
  "discovered": 5,
  "total": 10
}
```

### 8. Get Primary Phone Number

```http
GET /api/phone-numbers/primary/current
```

---

## Analytics API Updates

### Dashboard Metrics with Phone Number Filter

```http
GET /api/analytics/dashboard?phoneNumber=+919876543210
```

When `phoneNumber` is provided, all metrics are filtered to show only data for that specific number:

- **callsToday**: Only calls to/from selected number
- **avgCallDuration**: Average for selected number only
- **successRate**: Success rate for selected number
- **topFlows**: Top flows for selected number

---

## Frontend Usage

### 1. Phone Number Selector Component

```tsx
import { PhoneNumberSelector } from '@/components/PhoneNumberSelector';

function MyComponent() {
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);

  return (
    <PhoneNumberSelector
      selectedPhoneNumber={phoneNumber}
      onPhoneNumberChange={setPhoneNumber}
      className="my-custom-class"
    />
  );
}
```

**Props:**
- `selectedPhoneNumber`: Currently selected phone number (or null for "All")
- `onPhoneNumberChange`: Callback when selection changes
- `className`: Optional CSS classes

### 2. Using with Analytics API

```tsx
import { analyticsApi } from '@/lib/api/analytics';

async function fetchMetrics(phoneNumber: string | null) {
  const metrics = await analyticsApi.getDashboardMetrics(phoneNumber);
  console.log(metrics);
}
```

### 3. Dashboard Example

The dashboard page already includes the phone number selector:

```tsx
export default function DashboardPage() {
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<string | null>(null);

  return (
    <div>
      <PhoneNumberSelector
        selectedPhoneNumber={selectedPhoneNumber}
        onPhoneNumberChange={setSelectedPhoneNumber}
      />

      {/* Metrics will be filtered by selectedPhoneNumber */}
      <MetricsCards phoneNumber={selectedPhoneNumber} />
    </div>
  );
}
```

---

## Setup Instructions

### Step 1: Run Database Migration

```bash
cd ivr-backend
npx prisma migrate deploy
npx prisma generate
```

### Step 2: Add Initial Phone Numbers

**Option A: Manual Creation**

```bash
curl -X POST http://localhost:3001/api/phone-numbers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "+919876543210",
    "friendlyName": "Customer Support Line",
    "isPrimary": true,
    "capabilities": {"voice": true, "sms": true},
    "metadata": {"department": "support"}
  }'
```

**Option B: Auto-Discovery**

```bash
curl -X POST http://localhost:3001/api/phone-numbers/discover \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

This will scan your call logs and automatically create phone number entries.

### Step 3: Restart Backend

```bash
cd ivr-backend
npm run start:dev
```

### Step 4: Test Frontend

1. Navigate to dashboard: `http://localhost:3000/dashboard`
2. Look for the "Phone Number" dropdown in the top-right
3. Select a phone number to filter metrics
4. Select "All Phone Numbers" to see aggregated metrics

---

## Use Cases

### 1. Multi-Department Organization

```javascript
// Create phone numbers for each department
await phoneNumbersApi.upsertPhoneNumber({
  number: "+919876543210",
  friendlyName: "Sales Department",
  metadata: { department: "sales", team: "B2B" }
});

await phoneNumbersApi.upsertPhoneNumber({
  number: "+919876543211",
  friendlyName: "Customer Support",
  metadata: { department: "support", shift: "day" }
});
```

### 2. Multi-Region Business

```javascript
// Create phone numbers for each region
await phoneNumbersApi.upsertPhoneNumber({
  number: "+919876543210",
  friendlyName: "Mumbai Office",
  metadata: { region: "mumbai", timezone: "Asia/Kolkata" }
});

await phoneNumbersApi.upsertPhoneNumber({
  number: "+917654321098",
  friendlyName: "Delhi Office",
  metadata: { region: "delhi", timezone: "Asia/Kolkata" }
});
```

### 3. Campaign Tracking

```javascript
// Create phone numbers for marketing campaigns
await phoneNumbersApi.upsertPhoneNumber({
  number: "+919876543210",
  friendlyName: "Summer Campaign 2026",
  metadata: {
    campaign: "summer_2026",
    channel: "tv_ads",
    startDate: "2026-05-01"
  }
});
```

---

## Admin Panel Integration

### Phone Numbers Management Page

Create a dedicated page to manage phone numbers:

**URL:** `/app/phone-numbers/page.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { phoneNumbersApi } from '@/lib/api/phone-numbers';

export default function PhoneNumbersManagementPage() {
  const [phoneNumbers, setPhoneNumbers] = useState([]);

  useEffect(() => {
    loadPhoneNumbers();
  }, []);

  const loadPhoneNumbers = async () => {
    const numbers = await phoneNumbersApi.getAllPhoneNumbers(true);
    setPhoneNumbers(numbers);
  };

  const handleSetPrimary = async (id: number) => {
    await phoneNumbersApi.updatePhoneNumber(id, { isPrimary: true });
    loadPhoneNumbers();
  };

  const handleDiscover = async () => {
    const result = await phoneNumbersApi.discoverPhoneNumbers();
    alert(`Discovered ${result.discovered} new numbers`);
    loadPhoneNumbers();
  };

  return (
    <div>
      <h1>Phone Numbers Management</h1>

      <button onClick={handleDiscover}>
        Auto-Discover Phone Numbers
      </button>

      <table>
        <thead>
          <tr>
            <th>Number</th>
            <th>Name</th>
            <th>Status</th>
            <th>Primary</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {phoneNumbers.map(phone => (
            <tr key={phone.id}>
              <td>{phone.number}</td>
              <td>{phone.friendlyName}</td>
              <td>{phone.isActive ? 'Active' : 'Inactive'}</td>
              <td>{phone.isPrimary ? 'Yes' : 'No'}</td>
              <td>
                {!phone.isPrimary && (
                  <button onClick={() => handleSetPrimary(phone.id)}>
                    Set as Primary
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## Best Practices

### 1. Naming Convention

Use clear, descriptive names:
- ✅ "Customer Support - Mumbai"
- ✅ "Sales Team - B2B Division"
- ✅ "Summer Campaign 2026"
- ❌ "Number 1"
- ❌ "Phone Line"

### 2. Primary Number

- Set one phone number as primary
- Primary number is auto-selected in filters
- Useful for main business line

### 3. Metadata Usage

Store additional context in metadata:
```json
{
  "department": "sales",
  "team": "enterprise",
  "region": "mumbai",
  "campaign": "q1_2026",
  "cost_center": "CC-1234"
}
```

### 4. Regular Cleanup

Periodically review and archive inactive numbers:
```javascript
// Deactivate old numbers
await phoneNumbersApi.updatePhoneNumber(id, { isActive: false });
```

---

## Troubleshooting

### Issue: No phone numbers showing in dropdown

**Solution:**
1. Check if backend is running
2. Run auto-discovery: `POST /api/phone-numbers/discover`
3. Manually add a phone number via API

### Issue: Metrics not filtering by phone number

**Solution:**
1. Check browser console for errors
2. Verify phone number parameter is being sent: Check Network tab in DevTools
3. Ensure backend analytics service is updated

### Issue: "All Phone Numbers" showing same data as filtered

**Solution:**
- This is expected if you only have data for one phone number
- Make test calls to different numbers to see filtering in action

---

## Security Considerations

### Role-Based Access

- **super_admin, admin**: Can create/update/delete phone numbers
- **manager, agent**: Can only view phone numbers
- All users can use phone number filter

### Data Privacy

- Phone numbers are sensitive data
- Ensure proper access controls
- Consider masking numbers in logs

---

## Performance Optimization

### Database Indexes

The following indexes are created for optimal performance:

```sql
CREATE INDEX "phone_numbers_number_idx" ON "phone_numbers"("number");
CREATE INDEX "phone_numbers_is_active_idx" ON "phone_numbers"("is_active");
CREATE INDEX "phone_numbers_is_primary_idx" ON "phone_numbers"("is_primary");
```

### Caching

Consider caching phone numbers list:
```typescript
// Cache for 5 minutes
const CACHE_TTL = 5 * 60 * 1000;
```

---

## Future Enhancements

### 1. Number Grouping

Group phone numbers by department/region:
```typescript
interface PhoneNumberGroup {
  id: number;
  name: string;
  phoneNumbers: PhoneNumber[];
}
```

### 2. Advanced Filtering

Filter by multiple phone numbers:
```typescript
phoneNumbers: string[] // ["+919876543210", "+919876543211"]
```

### 3. Historical Analysis

Compare metrics across phone numbers:
```typescript
comparePhoneNumbers(numbers: string[], startDate: Date, endDate: Date)
```

### 4. Bulk Operations

Bulk update phone numbers:
```typescript
bulkUpdate(updates: Array<{id: number, data: Partial<PhoneNumber>}>)
```

---

## Summary

✅ **Backend:** Phone numbers CRUD API, filtering in analytics
✅ **Frontend:** PhoneNumberSelector component, dashboard integration
✅ **Database:** PhoneNumber model with indexes
✅ **Features:** Auto-discovery, primary number, metadata support

**Benefits:**
- Filter metrics by specific phone numbers
- Track performance across multiple lines
- Support multi-department/multi-region businesses
- Campaign-specific analytics

---

**Implementation Complete!** 🎉

You can now filter all metrics and analytics by specific phone numbers in your telephony platform.
