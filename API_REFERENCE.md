# IVR System - API Reference

## Base URL
```
Development: http://localhost:3001
```

## Authentication

All endpoints except those marked as `[PUBLIC]` require JWT authentication.

Include the JWT token in the Authorization header:
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

## 📁 Health Check Endpoints

### GET /
Get basic health status

**Response:**
```json
{
  "status": "ok",
  "message": "IVR Backend Service is running",
  "timestamp": "2026-01-17T..."
}
```

### GET /health
Get detailed health information

**Response:**
```json
{
  "status": "ok",
  "message": "IVR Backend Service is running",
  "timestamp": "2026-01-17T...",
  "version": "1.0.0",
  "uptime": 123.456,
  "environment": "development",
  "memory": {
    "used": "45 MB",
    "total": "128 MB"
  }
}
```

---

## 🔐 Authentication Endpoints

### POST /api/auth/register `[PUBLIC]`
Register a new user

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "role": "agent"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "agent",
    "fullName": "John Doe"
  }
}
```

### POST /api/auth/login `[PUBLIC]`
User login

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@ivr-system.com",
    "role": "super_admin",
    "fullName": "System Administrator"
  }
}
```

### POST /api/auth/refresh `[PUBLIC]`
Refresh access token

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### GET /api/auth/profile `[PROTECTED]`
Get current user profile

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@ivr-system.com",
    "role": "super_admin",
    "fullName": "System Administrator"
  }
}
```

---

## 📱 Exotel SMS Endpoints

### POST /api/exotel/send-sms `[PROTECTED]`
Send SMS to a user

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "toNumber": "+919876543210",
  "message": "Hello from IVR System!",
  "dltTemplateId": "TEMPLATE_ID_123",
  "dltEntityId": "ENTITY_ID_456"
}
```

**Response:**
```json
{
  "message": "SMS sent successfully",
  "data": {
    "SMSMessage": {
      "Sid": "sms_sid_12345",
      "To": "+919876543210",
      "From": "+919876543211",
      "Status": "queued",
      "DateSent": "2026-01-17T..."
    }
  }
}
```

### GET /api/exotel/sms-callbacks `[PROTECTED]`
Get SMS callbacks for a number

**Query Parameters:**
- `toNumber` (required): Phone number

**Example:**
```
GET /api/exotel/sms-callbacks?toNumber=+919876543210
```

**Response:**
```json
{
  "count": 5,
  "callbacks": [
    {
      "id": 1,
      "smsSid": "sms_sid_12345",
      "toNumber": "+919876543210",
      "status": "sent",
      "detailedStatus": "delivered",
      "createdAt": "2026-01-17T..."
    }
  ]
}
```

---

## 📞 Exotel Voice Call Endpoints

### POST /api/exotel/make-call `[PROTECTED]`
Make a voice call to a user

**Request Body:**
```json
{
  "toNumber": "+919876543210",
  "fromNumber": "+919876543211",
  "record": "true"
}
```

**Response:**
```json
{
  "message": "Call initiated successfully",
  "data": {
    "Call": {
      "Sid": "call_sid_12345",
      "To": "+919876543210",
      "From": "+919876543211",
      "Status": "queued",
      "DateCreated": "2026-01-17T..."
    }
  }
}
```

### POST /api/exotel/connect-call `[PROTECTED]`
Connect two numbers via voice call

**Request Body:**
```json
{
  "fromNumber": "+919876543210",
  "toNumber": "+919876543211"
}
```

**Response:**
```json
{
  "message": "Call connected successfully",
  "data": {
    "Call": {
      "Sid": "call_sid_12345",
      "From": "+919876543210",
      "To": "+919876543211",
      "Status": "queued"
    }
  }
}
```

### GET /api/exotel/voice-callbacks `[PROTECTED]`
Get voice call callbacks for a number

**Query Parameters:**
- `toNumber` (required): Phone number

**Example:**
```
GET /api/exotel/voice-callbacks?toNumber=+919876543210
```

**Response:**
```json
{
  "count": 3,
  "callbacks": [
    {
      "id": 1,
      "callSid": "call_sid_12345",
      "toNumber": "+919876543210",
      "fromNumber": "+919876543211",
      "status": "completed",
      "duration": "120",
      "recordingUrl": "https://...",
      "createdAt": "2026-01-17T..."
    }
  ]
}
```

---

## 🎧 Webhook Endpoints (Exotel Callbacks)

### POST /api/webhooks/exotel/sms-callback/:callbackId/:tokenMd5 `[PUBLIC]`
SMS status callback webhook (called by Exotel)

**Note:** This endpoint is called by Exotel's servers. Do not call manually.

**Request Body:** (Sent by Exotel)
```json
{
  "SmsSid": "sms_sid_12345",
  "To": "+919876543210",
  "Status": "sent",
  "DetailedStatus": "delivered",
  "DateSent": "2026-01-17T..."
}
```

### POST /api/webhooks/exotel/call-callback/:callbackId/:tokenMd5 `[PUBLIC]`
Voice call status callback webhook (called by Exotel)

**Note:** This endpoint is called by Exotel's servers. Do not call manually.

**Request Body:** (Sent by Exotel)
```json
{
  "CallSid": "call_sid_12345",
  "From": "+919876543210",
  "To": "+919876543211",
  "Status": "completed",
  "Duration": "120",
  "RecordingUrl": "https://..."
}
```

---

## 📊 Response Status Codes

| Code | Meaning |
|------|---------|
| 200  | OK - Request successful |
| 201  | Created - Resource created successfully |
| 400  | Bad Request - Invalid request parameters |
| 401  | Unauthorized - Authentication required or failed |
| 403  | Forbidden - Insufficient permissions |
| 404  | Not Found - Resource not found |
| 409  | Conflict - Resource already exists |
| 500  | Internal Server Error - Server error |

---

## 🔑 User Roles

| Role        | Description | Permissions |
|-------------|-------------|-------------|
| super_admin | System Administrator | Full access to all features |
| admin       | Administrator | Manage flows, users, configuration |
| manager     | Manager | View analytics, limited config |
| agent       | Support Agent | View assigned calls only |

---

## 📝 Data Models

### User
```typescript
{
  id: number;
  username: string;
  email: string;
  fullName?: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### SMS Callback
```typescript
{
  id: number;
  smsSid: string;
  toNumber: string;
  status: string;
  detailedStatus?: string;
  detailedStatusCode?: string;
  smsUnits?: string;
  dateSent?: string;
  createdAt: Date;
}
```

### Voice Callback
```typescript
{
  id: number;
  callSid: string;
  toNumber: string;
  fromNumber: string;
  status: string;
  duration?: string;
  startTime?: string;
  endTime?: string;
  recordingUrl?: string;
  createdAt: Date;
}
```

---

## 🧪 Testing with cURL

### 1. Register and Login

```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User",
    "role": "agent"
  }'

# Login (save the accessToken)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

### 2. Send SMS

```bash
export TOKEN="YOUR_ACCESS_TOKEN_HERE"

curl -X POST http://localhost:3001/api/exotel/send-sms \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "toNumber": "+919876543210",
    "message": "Test message",
    "dltTemplateId": "TEMPLATE_ID",
    "dltEntityId": "ENTITY_ID"
  }'
```

### 3. Make Call

```bash
curl -X POST http://localhost:3001/api/exotel/make-call \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "toNumber": "+919876543210",
    "record": "true"
  }'
```

### 4. Get Callbacks

```bash
# SMS callbacks
curl -X GET "http://localhost:3001/api/exotel/sms-callbacks?toNumber=%2B919876543210" \
  -H "Authorization: Bearer $TOKEN"

# Voice callbacks
curl -X GET "http://localhost:3001/api/exotel/voice-callbacks?toNumber=%2B919876543210" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📚 Interactive Documentation

For a better experience, use the Swagger UI:

**http://localhost:3001/api/docs**

Features:
- Try out API endpoints directly from the browser
- See request/response schemas
- Automatic Bearer token authentication
- Complete API documentation

---

## 🚀 Rate Limiting

Currently, there are no rate limits in development. Production deployment will include:
- 100 requests/minute per user
- 1000 requests/hour per IP
- Separate limits for webhook endpoints

---

## 📖 Additional Resources

- **Exotel API Documentation**: https://developer.exotel.com/
- **NestJS Documentation**: https://docs.nestjs.com/
- **Prisma Documentation**: https://www.prisma.io/docs/

---

**Last Updated:** Phase 1 Implementation (2026-01-17)
