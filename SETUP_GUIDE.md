# IVR System - Setup Guide

## Phase 1 Implementation Complete ✅

Congratulations! Phase 1 (Weeks 1-3) has been successfully implemented with the following features:

### ✅ Completed Features

#### Week 1: Backend Foundation
- ✅ NestJS project with TypeScript configuration
- ✅ PostgreSQL database with Docker Compose
- ✅ Prisma ORM with complete database schema
- ✅ Redis for session management (Docker Compose)
- ✅ Environment configuration (.env)
- ✅ Jest testing framework with initial tests

#### Week 2: Authentication System
- ✅ User entity and authentication module
- ✅ Passport.js + JWT authentication
- ✅ Login/Register endpoints with RBAC
- ✅ Role-based access control (Super Admin, Admin, Manager, Agent)
- ✅ JWT access and refresh tokens
- ✅ Password hashing with bcrypt
- ✅ Swagger API documentation
- ✅ Comprehensive authentication tests

#### Week 3: Exotel Integration
- ✅ Exotel service ported from Spring Boot to Node.js
- ✅ SMS sending capabilities with DLT compliance
- ✅ Voice call functionality
- ✅ Webhook endpoints for SMS and voice callbacks
- ✅ Database storage for callbacks
- ✅ HTTP client with axios (connection pooling)

---

## Prerequisites

Before starting, ensure you have:

- ✅ **Node.js 20 LTS** or higher
- ✅ **Docker Desktop** (for PostgreSQL and Redis)
- ✅ **ngrok** (for local webhook testing)
- ✅ **Exotel Account** with API credentials

---

## Installation Steps

### 1. Install Dependencies

```bash
cd ivr-backend
npm install
```

### 2. Configure Environment Variables

The `.env` file is already created. Update the following values:

```bash
# Exotel Configuration - REQUIRED
EXOTEL_API_KEY=your_exotel_api_key_here
EXOTEL_API_SECRET=your_exotel_api_secret_here
EXOTEL_SID=your_exotel_sid_here
EXOTEL_FROM_NUMBER=+919876543210  # Your Exotel virtual number
EXOTEL_CALLER_ID=+919876543210    # Your caller ID

# JWT Secrets - CHANGE THESE
JWT_SECRET=generate_a_strong_random_string_here
JWT_REFRESH_SECRET=generate_another_strong_random_string_here

# NGROK URL (update after starting ngrok)
NGROK_URL=https://your-ngrok-url.ngrok.io
```

### 3. Start Database Services

Start PostgreSQL and Redis using Docker Compose:

```bash
# From the telephony directory (not ivr-backend)
cd /Users/shantanuchandra/code/amara/demo/telephony
docker-compose up -d postgres redis
```

Verify services are running:

```bash
docker-compose ps
```

You should see:
- ✅ `ivr-postgres` (running on port 5432)
- ✅ `ivr-redis` (running on port 6379)

### 4. Setup Database Schema

Generate Prisma Client and run migrations:

```bash
cd ivr-backend

# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed the database with test data
npm run prisma:seed
```

Expected output:
```
✅ Cleaned up existing data
✅ Created users (admin, manager, agent)
✅ Created business hours
✅ Created queues (Sales, Support)
✅ Created agents (3 agents)
✅ Created sample IVR flow with nodes and connections
✅ Updated flow entry node
✅ Created audit log entry

🎉 Database seeding completed successfully!

📋 Created resources:
   - 3 Users (admin/admin123, manager/manager123, agent/agent123)
   - 1 Business Hours Configuration
   - 2 Queues (Sales, Support)
   - 3 Agents
   - 1 IVR Flow with 6 nodes
   - 1 Audit Log Entry
```

### 5. Start the Backend Server

```bash
npm run start:dev
```

Expected output:
```
🚀 IVR Backend Server is running on: http://localhost:3001
📚 API Documentation available at: http://localhost:3001/api/docs
✅ Database connected successfully
```

### 6. Setup ngrok for Webhooks (Local Development)

In a separate terminal:

```bash
ngrok http 3001
```

Copy the HTTPS URL (e.g., `https://abcd1234.ngrok.io`) and update your `.env` file:

```env
NGROK_URL=https://abcd1234.ngrok.io
```

Restart the backend server to apply the change.

---

## Testing the Installation

### 1. Test API Health Check

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "IVR Backend Service is running",
  "timestamp": "2026-01-17T...",
  "version": "1.0.0",
  "uptime": 123.456
}
```

### 2. Test Authentication

#### Register a New User:

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User",
    "role": "agent"
  }'
```

#### Login with Default Admin:

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

Expected response:
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

Copy the `accessToken` for subsequent requests.

### 3. Test Protected Endpoint

```bash
curl http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

### 4. Test Exotel Integration (SMS)

**IMPORTANT**: Only test this if you have valid Exotel credentials and sufficient balance.

```bash
curl -X POST http://localhost:3001/api/exotel/send-sms \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "toNumber": "+919876543210",
    "message": "Hello from IVR System!",
    "dltTemplateId": "YOUR_DLT_TEMPLATE_ID",
    "dltEntityId": "YOUR_DLT_ENTITY_ID"
  }'
```

---

## Swagger API Documentation

Access the interactive API documentation at:

🔗 **http://localhost:3001/api/docs**

The Swagger UI provides:
- ✅ Complete API endpoint documentation
- ✅ Request/response schemas
- ✅ Try-it-out functionality
- ✅ Authentication (click "Authorize" and paste your JWT token)

---

## Database Management

### Prisma Studio (GUI)

View and edit database records using Prisma Studio:

```bash
npm run prisma:studio
```

This opens a web interface at `http://localhost:5555`

### Direct PostgreSQL Access

```bash
docker exec -it ivr-postgres psql -U ivr_user -d ivr_system
```

Common queries:
```sql
-- List all users
SELECT id, username, email, role FROM users;

-- List all IVR flows
SELECT id, name, status, version FROM ivr_flows;

-- List SMS callbacks
SELECT id, to_number, status, created_at FROM sms_callbacks ORDER BY created_at DESC LIMIT 10;

-- List voice callbacks
SELECT id, to_number, from_number, status, duration, created_at FROM voice_callbacks ORDER BY created_at DESC LIMIT 10;
```

---

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# View coverage report
open coverage/lcov-report/index.html
```

---

## Project Structure

```
ivr-backend/
├── src/
│   ├── main.ts                     # Application entry point
│   ├── app.module.ts               # Root module
│   ├── app.controller.ts           # Health check endpoints
│   ├── app.service.ts              # Health check service
│   ├── auth/                       # Authentication module
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── auth.controller.ts
│   │   ├── dto/                    # Login, Register DTOs
│   │   ├── strategies/             # JWT and Local strategies
│   │   └── guards/                 # Auth guards
│   ├── users/                      # User management
│   │   ├── users.module.ts
│   │   ├── users.service.ts
│   │   └── dto/
│   ├── exotel/                     # Exotel integration
│   │   ├── exotel.module.ts
│   │   ├── exotel.service.ts
│   │   ├── exotel.controller.ts
│   │   ├── dto/
│   │   └── interfaces/
│   ├── prisma/                     # Database service
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   └── common/                     # Shared utilities
│       └── decorators/
├── prisma/
│   ├── schema.prisma               # Database schema
│   ├── seed.ts                     # Seed data
│   └── migrations/                 # Database migrations
├── test/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── package.json
├── tsconfig.json
├── .env                            # Environment variables
└── README.md
```

---

## Default Credentials

The seeded database includes the following users:

| Username | Password    | Role         | Email                   |
|----------|-------------|--------------|-------------------------|
| admin    | admin123    | super_admin  | admin@ivr-system.com    |
| manager  | manager123  | manager      | manager@ivr-system.com  |
| agent    | agent123    | agent        | agent@ivr-system.com    |

**⚠️ IMPORTANT**: Change these passwords in production!

---

## Common Issues & Troubleshooting

### 1. "Port 3001 is already in use"

Kill the process using port 3001:
```bash
lsof -ti:3001 | xargs kill -9
```

### 2. "Database connection failed"

Ensure PostgreSQL is running:
```bash
docker-compose up -d postgres
docker-compose ps
```

Check logs:
```bash
docker-compose logs postgres
```

### 3. "Prisma Client not found"

Regenerate Prisma Client:
```bash
npm run prisma:generate
```

### 4. "Exotel API error"

- Verify your Exotel credentials in `.env`
- Check Exotel account balance
- Ensure DLT template is approved (for SMS)
- Check ngrok URL is correctly configured

### 5. "Webhook not receiving callbacks"

- Ensure ngrok is running
- Update `NGROK_URL` in `.env` and restart server
- Check ngrok web interface: `http://localhost:4040`
- Verify webhook URL in Exotel dashboard

---

## Next Steps

Phase 1 is complete! Next phases will implement:

### Phase 2: IVR Engine Core (Weeks 4-6)
- IVR Data Models (IvrFlow, FlowNode, FlowConnection)
- IVR Node Types (Welcome, Play, Menu, Hangup)
- Flow Execution Engine with state management
- Exotel Passthru XML generation

### Phase 3: Advanced IVR Features (Weeks 7-8)
- Advanced nodes (Queue, Transfer, Record, Decision)
- Queue and agent management
- Business hours validation

### Phase 4: Frontend Foundation (Weeks 9-10)
- Next.js project setup
- Dashboard UI
- Flow management interface

### Phase 5: Flow Builder (Weeks 11-12)
- Visual flow editor with React Flow
- Node configuration panels
- Flow testing simulator

### Phase 6: Analytics & Polish (Weeks 13-14)
- Analytics dashboard
- Call history and reports
- Production readiness

---

## Resources

- **API Documentation**: http://localhost:3001/api/docs
- **Prisma Studio**: http://localhost:5555 (when running)
- **ngrok Web Interface**: http://localhost:4040
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

---

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review API documentation at `/api/docs`
3. Check application logs
4. Verify environment variables

---

**🎉 Congratulations! Your IVR system backend is now running!**
