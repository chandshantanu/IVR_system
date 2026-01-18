# IVR System Backend

A production-grade Interactive Voice Response (IVR) system backend built with NestJS, PostgreSQL, and Redis.

## Features

- 🎯 IVR Flow Engine with visual flow builder support
- 📞 Exotel API Integration (SMS, Voice Calls, Webhooks)
- 🔐 JWT Authentication with Role-Based Access Control (RBAC)
- 📊 Real-time Analytics and Reporting
- 🔄 Queue Management and Agent Routing
- 🧪 Comprehensive Test Coverage (Unit, Integration, E2E)
- 📚 Auto-generated API Documentation (Swagger)
- 🐳 Docker Support

## Prerequisites

- Node.js 20 LTS or higher
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

Copy the example environment file and update with your configuration:

```bash
cp .env.example .env
```

Edit `.env` and configure:
- Database connection string
- Redis connection details
- Exotel API credentials
- JWT secrets

### 3. Setup Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# (Optional) Seed database with test data
npm run prisma:seed
```

### 4. Run the Application

```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The application will be available at:
- API: http://localhost:3001
- Swagger Documentation: http://localhost:3001/api/docs

## Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e
```

## Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Project Structure

```
src/
├── main.ts                 # Application entry point
├── app.module.ts           # Root module
├── common/                 # Shared utilities, guards, interceptors
├── config/                 # Configuration modules
├── auth/                   # Authentication module
├── users/                  # User management
├── exotel/                 # Exotel integration
├── ivr/                    # IVR flow engine
│   ├── flows/              # Flow management
│   ├── nodes/              # Node types
│   ├── execution/          # Flow execution engine
│   └── webhooks/           # Exotel webhooks
├── queue/                  # Call queue management
├── agents/                 # Agent management
├── analytics/              # Analytics and reporting
└── websockets/             # Real-time updates
```

## API Documentation

Once the server is running, visit http://localhost:3001/api/docs to view the interactive Swagger documentation.

Key endpoints:
- `POST /api/auth/login` - User authentication
- `POST /api/ivr/flows` - Create IVR flow
- `POST /api/exotel/sms` - Send SMS
- `POST /api/webhooks/exotel/*` - Exotel callbacks

## Development Guidelines

### Testing (TDD Approach)

1. Write tests first (Red phase)
2. Implement minimum code to pass tests (Green phase)
3. Refactor while keeping tests green (Refactor phase)

### Commit Convention

Follow conventional commits:
```
feat(auth): add JWT authentication
fix(exotel): correct webhook parsing
test(ivr): add flow execution tests
```

## Environment Variables

See `.env.example` for all available configuration options.

## License

MIT

## Support

For issues and questions, please open an issue in the repository.
