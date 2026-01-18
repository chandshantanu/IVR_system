# IVR System - Quick Start Guide

Get your IVR system running in 5 minutes! ⚡

---

## ✨ What You'll Get

- 🎨 **Management UI** at http://localhost:3000
- 📡 **Backend API** at http://localhost:3001
- 🗄️ **PostgreSQL Database** at localhost:5432
- 🔴 **Redis Cache** at localhost:6379
- 📚 **API Documentation** at http://localhost:3001/api/docs

---

## 🚀 One-Command Start

```bash
./start.sh
```

That's it! The script will:
✅ Check Docker is installed
✅ Create .env if needed
✅ Start all services
✅ Wait for health checks
✅ Seed the database
✅ Show you the URLs

---

## 📋 Prerequisites

Install these first:
- ✅ **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop)
- ✅ **ngrok** (optional, for webhooks) - [Download here](https://ngrok.com/download)

Verify installation:
```bash
docker --version
docker-compose --version
```

---

## 🎯 Step-by-Step

### 1. Configure Exotel Credentials

```bash
# Edit .env file
nano .env
```

Add your credentials:
```env
EXOTEL_API_KEY=your_api_key
EXOTEL_API_SECRET=your_api_secret
EXOTEL_SID=your_sid
```

### 2. Start the Stack

```bash
# Automated
./start.sh

# OR using Make
make quickstart

# OR manually
docker-compose up -d
docker-compose exec backend npm run prisma:seed
```

### 3. Open the UI

Visit: **http://localhost:3000**

Login with:
- Username: `admin`
- Password: `admin123`

---

## 🎨 What You'll See

### Frontend (http://localhost:3000)
- **Login Page** - Clean, professional authentication
- **Dashboard** - Metrics cards and welcome information
- **Navigation** - Sidebar with Dashboard, Flows, Agents, etc.
- **IVR Flows** - Flow management interface

### Backend (http://localhost:3001)
- **API Endpoints** - RESTful APIs for all operations
- **Swagger Docs** - Interactive API documentation
- **Health Check** - `/health` endpoint

---

## 🔐 Default Credentials

| Service | Username | Password | Role |
|---------|----------|----------|------|
| Frontend/API | admin | admin123 | super_admin |
| Frontend/API | manager | manager123 | manager |
| Frontend/API | agent | agent123 | agent |
| PostgreSQL | ivr_user | ivr_password... | - |

**⚠️ Change these in production!**

---

## ✅ Verify Everything Works

### 1. Check Services

```bash
docker-compose ps
```

Expected:
```
NAME            STATUS
ivr-frontend    Up (healthy)
ivr-backend     Up (healthy)
ivr-postgres    Up (healthy)
ivr-redis       Up (healthy)
```

### 2. Test Frontend

```bash
curl http://localhost:3000
```

Should return HTML.

### 3. Test Backend

```bash
curl http://localhost:3001/health
```

Should return:
```json
{
  "status": "ok",
  "message": "IVR Backend Service is running",
  ...
}
```

### 4. Test Authentication

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Should return JWT tokens.

---

## 🆘 Common Issues

### "Port 3000 is already in use"

```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9

# Restart
docker-compose restart frontend
```

### "Cannot connect to database"

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Restart if needed
docker-compose restart postgres
```

### "Frontend shows blank page"

```bash
# Check logs
docker-compose logs frontend

# Rebuild if needed
docker-compose up -d --build frontend
```

### "Backend returns 500 errors"

```bash
# Check logs
docker-compose logs backend

# Check database connection
docker-compose exec backend npx prisma studio
```

---

## 🛠️ Useful Commands

```bash
# View logs
docker-compose logs -f

# View specific service
docker-compose logs -f frontend
docker-compose logs -f backend

# Restart everything
docker-compose restart

# Stop everything
docker-compose down

# Stop and remove data (CAUTION!)
docker-compose down -v

# Open backend shell
docker-compose exec backend sh

# Open database GUI
docker-compose exec backend npx prisma studio

# Run tests
docker-compose exec backend npm test
```

---

## 🎓 Next Steps

### 1. Explore the Dashboard
- Login at http://localhost:3000
- Check the metrics cards
- Navigate through different sections

### 2. Try the API
- Open http://localhost:3001/api/docs
- Try the authentication endpoints
- Send a test SMS (if you have Exotel credits)

### 3. Setup ngrok (for webhooks)

```bash
# Start ngrok
ngrok http 3001

# Copy the HTTPS URL
# Update .env
NGROK_URL=https://your-url.ngrok.io

# Restart backend
docker-compose restart backend
```

### 4. Customize
- Add your branding
- Configure business hours
- Create custom flows
- Add agents

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [FRONTEND_GUIDE.md](./FRONTEND_GUIDE.md) | Frontend development guide |
| [DOCKER_SETUP.md](./DOCKER_SETUP.md) | Complete Docker guide |
| [API_REFERENCE.md](./API_REFERENCE.md) | API documentation |
| [SETUP_GUIDE.md](./SETUP_GUIDE.md) | Detailed setup instructions |

---

## 💡 Tips

- **Use Make commands**: `make up`, `make logs`, `make down`
- **Check health regularly**: `make health`
- **View database**: `make studio`
- **Keep logs open**: Helps debug issues quickly
- **Commit often**: Use git to track changes

---

## 🎉 Success!

If you see:
- ✅ Frontend loading at http://localhost:3000
- ✅ Login page working
- ✅ Dashboard displaying
- ✅ No errors in logs

**You're all set!** 🚀

---

## 📞 Getting Help

1. **Check logs**: `docker-compose logs`
2. **Review docs**: See documentation links above
3. **Test endpoints**: Use Swagger UI at `/api/docs`
4. **Verify services**: `docker-compose ps`

---

**⏱️ Estimated time to complete: 5 minutes**

**🎯 Difficulty: Easy**

**✨ Result: Full-stack IVR system running locally**
