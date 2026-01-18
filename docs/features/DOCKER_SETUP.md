# IVR System - Docker Setup Guide

Complete guide for running the entire IVR system stack using Docker and Docker Compose.

---

## 📦 What's Included in Docker Stack

- **PostgreSQL 15** - Production database
- **Redis 7** - Session management and caching
- **NestJS Backend** - IVR backend API (Node.js 20)

---

## Prerequisites

✅ **Docker Desktop** 4.0+ (includes Docker Compose V2)
✅ **4GB+ RAM** allocated to Docker
✅ **10GB+ disk space**
✅ **ngrok** (for webhook testing)

Verify installation:
```bash
docker --version
docker-compose --version
```

---

## 🚀 Quick Start (Development)

### 1. Clone and Configure

```bash
cd /Users/shantanuchandra/code/amara/demo/telephony
```

### 2. Set Environment Variables

Copy and edit the environment file:

```bash
cp .env.example .env
```

Edit `.env` and set your Exotel credentials:

```env
# Required: Get from https://my.exotel.com/
EXOTEL_API_KEY=your_api_key_here
EXOTEL_API_SECRET=your_api_secret_here
EXOTEL_SID=your_sid_here
EXOTEL_FROM_NUMBER=+919876543210
EXOTEL_CALLER_ID=+919876543210

# JWT Secrets (change these!)
JWT_SECRET=your_super_secret_jwt_key_12345
JWT_REFRESH_SECRET=your_super_secret_refresh_key_67890

# ngrok URL (update after starting ngrok)
NGROK_URL=https://your-ngrok-url.ngrok.io
```

### 3. Start All Services

```bash
docker-compose up -d
```

This will:
- ✅ Start PostgreSQL on port 5432
- ✅ Start Redis on port 6379
- ✅ Build and start the NestJS backend on port 3001
- ✅ Run database migrations automatically
- ✅ Generate Prisma Client

### 4. Check Service Status

```bash
docker-compose ps
```

Expected output:
```
NAME            IMAGE              STATUS         PORTS
ivr-backend     ivr-backend        Up (healthy)   0.0.0.0:3001->3001/tcp
ivr-postgres    postgres:15        Up (healthy)   0.0.0.0:5432->5432/tcp
ivr-redis       redis:7            Up (healthy)   0.0.0.0:6379->6379/tcp
```

### 5. View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f postgres
docker-compose logs -f redis
```

### 6. Seed Database (First Time Only)

```bash
docker-compose exec backend npm run prisma:seed
```

Expected output:
```
🌱 Starting database seed...
✅ Cleaned up existing data
✅ Created users (admin, manager, agent)
✅ Created business hours
✅ Created queues (Sales, Support)
✅ Created agents (3 agents)
✅ Created sample IVR flow with nodes and connections
🎉 Database seeding completed successfully!
```

### 7. Setup ngrok for Webhooks

In a separate terminal:

```bash
ngrok http 3001
```

Copy the HTTPS URL and update `.env`:

```env
NGROK_URL=https://abcd1234.ngrok.io
```

Restart the backend to apply changes:

```bash
docker-compose restart backend
```

---

## ✅ Verify Installation

### 1. Test Health Check

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "IVR Backend Service is running",
  "timestamp": "2026-01-17T...",
  "version": "1.0.0"
}
```

### 2. Test API Documentation

Open in browser:
```
http://localhost:3001/api/docs
```

You should see the Swagger UI with all API endpoints.

### 3. Test Authentication

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

Expected: JWT tokens and user object

---

## 🛠️ Common Docker Commands

### Start Services

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d backend

# Start with build (rebuild images)
docker-compose up -d --build
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (CAUTION: deletes data!)
docker-compose down -v
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### View Logs

```bash
# Follow all logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100

# Backend only
docker-compose logs -f backend
```

### Execute Commands in Container

```bash
# Open shell in backend container
docker-compose exec backend sh

# Run Prisma commands
docker-compose exec backend npx prisma studio
docker-compose exec backend npx prisma migrate dev
docker-compose exec backend npm test

# Access PostgreSQL
docker-compose exec postgres psql -U ivr_user -d ivr_system
```

---

## 🗄️ Database Management

### Prisma Studio (GUI)

Start Prisma Studio from Docker container:

```bash
docker-compose exec backend npx prisma studio
```

Open: http://localhost:5555

### Direct PostgreSQL Access

```bash
docker-compose exec postgres psql -U ivr_user -d ivr_system
```

Common queries:
```sql
-- List users
SELECT id, username, email, role FROM users;

-- List IVR flows
SELECT id, name, status, version FROM ivr_flows;

-- Recent SMS callbacks
SELECT * FROM sms_callbacks ORDER BY created_at DESC LIMIT 10;

-- Recent voice callbacks
SELECT * FROM voice_callbacks ORDER BY created_at DESC LIMIT 10;
```

### Database Backup

```bash
# Backup
docker-compose exec postgres pg_dump -U ivr_user ivr_system > backup.sql

# Restore
docker-compose exec -T postgres psql -U ivr_user ivr_system < backup.sql
```

---

## 🔄 Development Workflow

### Hot Reload (Already Enabled)

The backend container is configured for hot reload. Any changes to `ivr-backend/src/**` will automatically restart the server.

### Running Tests

```bash
# Unit tests
docker-compose exec backend npm test

# Test with coverage
docker-compose exec backend npm run test:cov

# E2E tests
docker-compose exec backend npm run test:e2e
```

### Database Migrations

```bash
# Create migration
docker-compose exec backend npx prisma migrate dev --name migration_name

# Deploy migrations (production)
docker-compose exec backend npx prisma migrate deploy

# Reset database (CAUTION!)
docker-compose exec backend npx prisma migrate reset
```

### Install New Dependencies

```bash
# Install package
docker-compose exec backend npm install package-name

# Rebuild container (if package.json changed)
docker-compose up -d --build backend
```

---

## 🚀 Production Deployment

### Build Production Images

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
```

### Run Production Stack

```bash
# Set production environment variables
export POSTGRES_PASSWORD=strong_random_password
export REDIS_PASSWORD=another_strong_password

# Start production stack
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Production Environment Variables

Create `.env.production`:

```env
# Database (use strong passwords)
POSTGRES_USER=ivr_user
POSTGRES_PASSWORD=your_strong_db_password
POSTGRES_DB=ivr_system

# Redis
REDIS_PASSWORD=your_strong_redis_password

# JWT (use strong secrets)
JWT_SECRET=generate_a_strong_random_string_32_chars_min
JWT_REFRESH_SECRET=generate_another_strong_random_string

# Exotel
EXOTEL_API_KEY=your_production_api_key
EXOTEL_API_SECRET=your_production_api_secret
EXOTEL_SID=your_production_sid
EXOTEL_FROM_NUMBER=+919876543210

# Application URL (your domain)
NGROK_URL=https://your-production-domain.com
```

### Production Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT secrets (32+ characters)
- [ ] Enable SSL/TLS (use reverse proxy like nginx)
- [ ] Remove database port exposure (use internal network only)
- [ ] Enable Redis authentication
- [ ] Set up firewall rules
- [ ] Configure log rotation
- [ ] Enable automated backups
- [ ] Use Docker secrets for sensitive data

---

## 🐛 Troubleshooting

### Backend Container Won't Start

**Check logs:**
```bash
docker-compose logs backend
```

**Common issues:**
- Database connection failed → Ensure postgres is healthy
- Port 3001 in use → Stop other services on that port
- Prisma generation failed → Rebuild with `--build` flag

### Database Connection Errors

**Verify PostgreSQL is running:**
```bash
docker-compose ps postgres
```

**Check database logs:**
```bash
docker-compose logs postgres
```

**Test connection:**
```bash
docker-compose exec postgres pg_isready -U ivr_user
```

### Container Keeps Restarting

**Check health status:**
```bash
docker-compose ps
```

**View recent logs:**
```bash
docker-compose logs --tail=50 backend
```

**Common causes:**
- Migrations failed
- Database not ready
- Missing environment variables
- Port conflicts

### Hot Reload Not Working

**Verify volume mounts:**
```bash
docker-compose exec backend ls -la /app
```

**Restart container:**
```bash
docker-compose restart backend
```

### Out of Disk Space

**Check Docker disk usage:**
```bash
docker system df
```

**Clean up:**
```bash
# Remove unused images
docker image prune -a

# Remove unused volumes (CAUTION!)
docker volume prune

# Full cleanup
docker system prune -a --volumes
```

### Permission Issues (Linux/Mac)

**Fix file permissions:**
```bash
sudo chown -R $USER:$USER ivr-backend/
```

---

## 📊 Monitoring & Health Checks

### Container Health

```bash
# Check health status
docker-compose ps

# Backend health endpoint
curl http://localhost:3001/health

# Detailed health
curl http://localhost:3001/health | jq
```

### Resource Usage

```bash
# Real-time stats
docker stats

# Specific container
docker stats ivr-backend
```

### Logs Monitoring

```bash
# Follow all logs with timestamps
docker-compose logs -f -t

# Filter by service and level
docker-compose logs backend | grep ERROR
```

---

## 🔒 Security Best Practices

### 1. Environment Variables

- ❌ Never commit `.env` to Git
- ✅ Use `.env.example` as template
- ✅ Use Docker secrets in production

### 2. Network Security

- ✅ Use internal Docker networks
- ✅ Only expose necessary ports
- ✅ Use reverse proxy (nginx) for SSL

### 3. Container Security

- ✅ Run as non-root user (production image)
- ✅ Use minimal base images (alpine)
- ✅ Scan images for vulnerabilities

### 4. Database Security

- ✅ Use strong passwords
- ✅ Limit database connections
- ✅ Enable SSL for connections
- ✅ Regular backups

---

## 📚 Additional Resources

- **Docker Documentation**: https://docs.docker.com/
- **Docker Compose**: https://docs.docker.com/compose/
- **NestJS Docker**: https://docs.nestjs.com/recipes/docker
- **Prisma Docker**: https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-docker

---

## 🎯 Next Steps

1. ✅ Verify all services are running
2. ✅ Test authentication endpoints
3. ✅ Test Exotel integration (SMS/Voice)
4. ✅ Set up ngrok for webhook testing
5. ✅ Review API documentation at `/api/docs`
6. 🚀 Start implementing Phase 2 (IVR Engine)

---

## 💡 Pro Tips

- Use `docker-compose up -d` to run in background
- Add `--build` flag when changing dependencies
- Use `docker-compose exec` instead of `docker exec`
- Keep containers lightweight - use volumes for data
- Monitor logs regularly for issues
- Set up log aggregation for production

---

**🐳 Your IVR system is now fully Dockerized!**
