#!/bin/bash

# IVR System - Quick Start Script
# This script helps you get started quickly with Docker

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}"
echo "======================================"
echo "  IVR System - Quick Start"
echo "======================================"
echo -e "${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    echo "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: docker-compose is not installed${NC}"
    echo "Please install Docker Compose"
    exit 1
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}No .env file found. Copying from .env.example...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}Please edit .env file with your Exotel credentials:${NC}"
    echo "  - EXOTEL_API_KEY"
    echo "  - EXOTEL_API_SECRET"
    echo "  - EXOTEL_SID"
    echo ""
    read -p "Press Enter after editing .env to continue..."
fi

# Start services
echo -e "${GREEN}Starting services...${NC}"
docker-compose up -d

echo ""
echo -e "${GREEN}Waiting for services to be healthy...${NC}"
sleep 10

# Check if backend is healthy
MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is healthy!${NC}"
        break
    fi
    echo -e "${YELLOW}Waiting for backend to be ready... ($((RETRY_COUNT+1))/$MAX_RETRIES)${NC}"
    sleep 2
    RETRY_COUNT=$((RETRY_COUNT+1))
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${RED}Error: Backend failed to start${NC}"
    echo "Check logs: docker-compose logs backend"
    exit 1
fi

# Seed database
echo ""
echo -e "${GREEN}Seeding database...${NC}"
docker-compose exec -T backend npm run prisma:seed

echo ""
echo -e "${GREEN}======================================"
echo "  IVR System is ready! 🚀"
echo "======================================${NC}"
echo ""
echo "🎨 Frontend: http://localhost:3000"
echo "📡 API: http://localhost:3001"
echo "📚 Docs: http://localhost:3001/api/docs"
echo "🗄️  Database: localhost:5432"
echo "🔴 Redis: localhost:6379"
echo ""
echo -e "${YELLOW}Default Credentials:${NC}"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo -e "${YELLOW}Useful Commands:${NC}"
echo "  View logs:     docker-compose logs -f"
echo "  Stop:          docker-compose down"
echo "  Restart:       docker-compose restart"
echo "  Database GUI:  docker-compose exec backend npx prisma studio"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Setup ngrok: ngrok http 3001"
echo "  2. Update NGROK_URL in .env"
echo "  3. Restart backend: docker-compose restart backend"
echo "  4. Test API at: http://localhost:3001/api/docs"
echo ""
