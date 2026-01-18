# Docker Quick Reference

## 🚀 Quick Start Commands

```bash
# Automatic setup (recommended for first time)
./start.sh

# Or use Makefile
make quickstart

# Or manually
docker-compose up -d
docker-compose exec backend npm run prisma:seed
```

---

## 📦 Service Management

```bash
# Start all services
docker-compose up -d
make up

# Stop all services
docker-compose down
make down

# Restart all services
docker-compose restart
make restart

# Restart specific service
docker-compose restart backend

# View status
docker-compose ps
make status

# View logs
docker-compose logs -f
make logs

# View backend logs only
docker-compose logs -f backend
make logs-backend
```

---

## 🗄️ Database Commands

```bash
# Seed database
docker-compose exec backend npm run prisma:seed
make seed

# Open Prisma Studio (GUI)
docker-compose exec backend npx prisma studio
make studio

# Run migrations
docker-compose exec backend npx prisma migrate deploy
make migrate

# Open PostgreSQL shell
docker-compose exec postgres psql -U ivr_user -d ivr_system
make db-shell

# Backup database
docker-compose exec postgres pg_dump -U ivr_user ivr_system > backup.sql
make backup

# Restore database
cat backup.sql | docker-compose exec -T postgres psql -U ivr_user ivr_system
```

---

## 🧪 Testing Commands

```bash
# Run all tests
docker-compose exec backend npm test
make test

# Run with coverage
docker-compose exec backend npm run test:cov
make test-cov

# Run E2E tests
docker-compose exec backend npm run test:e2e
make test-e2e

# Run specific test file
docker-compose exec backend npm test -- auth.service.spec.ts
```

---

## 🛠️ Development Commands

```bash
# Open shell in backend container
docker-compose exec backend sh
make shell

# Install npm package
docker-compose exec backend npm install package-name

# Rebuild after package.json change
docker-compose up -d --build backend
make rebuild

# View real-time logs
docker-compose logs -f backend

# Check application health
curl http://localhost:3001/health
make health
```

---

## 🔍 Debugging

```bash
# Check container status
docker-compose ps

# View recent logs (last 100 lines)
docker-compose logs --tail=100 backend

# Follow logs with timestamps
docker-compose logs -f -t backend

# Inspect container
docker inspect ivr-backend

# Check resource usage
docker stats

# Access Redis CLI
docker-compose exec redis redis-cli
make redis-cli
```

---

## 🧹 Cleanup

```bash
# Stop and remove containers (data persists)
docker-compose down

# Remove containers AND volumes (⚠️ deletes data)
docker-compose down -v
make clean

# Remove unused images
docker image prune -a

# Full Docker cleanup
docker system prune -a --volumes
```

---

## 🚀 Production Commands

```bash
# Build production images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
make prod-build

# Start production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
make prod-up

# Stop production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
make prod-down
```

---

## 📋 Common Workflows

### First Time Setup
```bash
./start.sh
# OR
make quickstart
```

### Daily Development
```bash
# Start
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop when done
docker-compose down
```

### After Code Changes
```bash
# Hot reload is automatic for src/ changes
# For package.json or Dockerfile changes:
docker-compose up -d --build backend
```

### Database Changes
```bash
# Create migration
docker-compose exec backend npx prisma migrate dev --name my_migration

# View data
docker-compose exec backend npx prisma studio
```

### Testing
```bash
# Quick test
docker-compose exec backend npm test

# Full test with coverage
docker-compose exec backend npm run test:cov
```

---

## 🆘 Troubleshooting

### Backend won't start
```bash
# Check logs
docker-compose logs backend

# Rebuild
docker-compose up -d --build backend

# Check database connection
docker-compose exec postgres pg_isready -U ivr_user
```

### Database connection failed
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### Port already in use
```bash
# Check what's using port 3001
lsof -ti:3001

# Kill process
lsof -ti:3001 | xargs kill -9

# Or change port in docker-compose.yml
```

### Out of disk space
```bash
# Check usage
docker system df

# Clean up
docker system prune -a
docker volume prune
```

---

## 🔗 Useful URLs

- **API**: http://localhost:3001
- **API Docs**: http://localhost:3001/api/docs
- **Health Check**: http://localhost:3001/health
- **Prisma Studio**: http://localhost:5555 (after `make studio`)
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

---

## 💡 Pro Tips

1. **Use Makefile**: Shorter commands → `make up`, `make logs`, `make test`
2. **Alias common commands**: Add to `.bashrc` or `.zshrc`
3. **Watch logs**: Keep logs open in separate terminal
4. **Use Prisma Studio**: Great for debugging database issues
5. **Hot reload**: Changes to `src/` auto-reload (no rebuild needed)
6. **Test before commit**: Always run `make test` before committing
7. **Backup before migrate**: `make backup` before schema changes

---

## 📞 Default Credentials

| Service | User | Password |
|---------|------|----------|
| PostgreSQL | ivr_user | ivr_password_change_in_production |
| Backend API | admin | admin123 |
| Backend API | manager | manager123 |
| Backend API | agent | agent123 |

---

**Quick help:** `make help`
