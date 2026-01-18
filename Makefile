# IVR System - Makefile
# Quick commands for Docker operations

.PHONY: help build up down restart logs clean test seed studio backup

# Default target
.DEFAULT_GOAL := help

# Colors for output
GREEN  := \033[0;32m
YELLOW := \033[0;33m
NC     := \033[0m

help: ## Show this help message
	@echo '$(GREEN)IVR System - Available Commands:$(NC)'
	@echo ''
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ''

# Development
up: ## Start all services
	@echo "$(GREEN)Starting all services...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)Services started!$(NC)"
	@echo "API: http://localhost:3001"
	@echo "Docs: http://localhost:3001/api/docs"

down: ## Stop all services
	@echo "$(YELLOW)Stopping all services...$(NC)"
	docker-compose down
	@echo "$(GREEN)Services stopped!$(NC)"

restart: ## Restart all services
	@echo "$(YELLOW)Restarting services...$(NC)"
	docker-compose restart
	@echo "$(GREEN)Services restarted!$(NC)"

build: ## Build/rebuild all images
	@echo "$(GREEN)Building Docker images...$(NC)"
	docker-compose build
	@echo "$(GREEN)Build complete!$(NC)"

rebuild: ## Rebuild and start services
	@echo "$(GREEN)Rebuilding and starting services...$(NC)"
	docker-compose up -d --build
	@echo "$(GREEN)Services ready!$(NC)"

# Logs
logs: ## View logs from all services
	docker-compose logs -f

logs-backend: ## View backend logs only
	docker-compose logs -f backend

logs-db: ## View database logs only
	docker-compose logs -f postgres

# Database
seed: ## Seed database with test data
	@echo "$(GREEN)Seeding database...$(NC)"
	docker-compose exec backend npm run prisma:seed
	@echo "$(GREEN)Database seeded!$(NC)"

studio: ## Open Prisma Studio (database GUI)
	@echo "$(GREEN)Starting Prisma Studio...$(NC)"
	@echo "Opening http://localhost:5555"
	docker-compose exec backend npx prisma studio

migrate: ## Run database migrations
	@echo "$(GREEN)Running migrations...$(NC)"
	docker-compose exec backend npx prisma migrate deploy
	@echo "$(GREEN)Migrations complete!$(NC)"

migrate-dev: ## Create new migration
	@echo "$(YELLOW)Creating migration...$(NC)"
	docker-compose exec backend npx prisma migrate dev

backup: ## Backup database
	@echo "$(GREEN)Creating database backup...$(NC)"
	docker-compose exec postgres pg_dump -U ivr_user ivr_system > backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)Backup created!$(NC)"

# Testing
test: ## Run tests
	@echo "$(GREEN)Running tests...$(NC)"
	docker-compose exec backend npm test

test-cov: ## Run tests with coverage
	@echo "$(GREEN)Running tests with coverage...$(NC)"
	docker-compose exec backend npm run test:cov

test-e2e: ## Run E2E tests
	@echo "$(GREEN)Running E2E tests...$(NC)"
	docker-compose exec backend npm run test:e2e

# Utilities
shell: ## Open shell in backend container
	docker-compose exec backend sh

db-shell: ## Open PostgreSQL shell
	docker-compose exec postgres psql -U ivr_user -d ivr_system

redis-cli: ## Open Redis CLI
	docker-compose exec redis redis-cli

status: ## Check service status
	@echo "$(GREEN)Service Status:$(NC)"
	@docker-compose ps

health: ## Check application health
	@echo "$(GREEN)Checking application health...$(NC)"
	@curl -s http://localhost:3001/health | jq

# Cleanup
clean: ## Stop and remove all containers and volumes (CAUTION!)
	@echo "$(YELLOW)WARNING: This will delete all data!$(NC)"
	@echo "Press Ctrl+C to cancel, or wait 5 seconds to continue..."
	@sleep 5
	docker-compose down -v
	@echo "$(GREEN)Cleanup complete!$(NC)"

clean-images: ## Remove all Docker images
	@echo "$(YELLOW)Removing Docker images...$(NC)"
	docker-compose down --rmi all
	@echo "$(GREEN)Images removed!$(NC)"

# Production
prod-build: ## Build production images
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

prod-up: ## Start production stack
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

prod-down: ## Stop production stack
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml down

# Quick start
quickstart: build up seed ## Quick start: build, start, and seed
	@echo ""
	@echo "$(GREEN)=====================================$(NC)"
	@echo "$(GREEN)  IVR System is ready!$(NC)"
	@echo "$(GREEN)=====================================$(NC)"
	@echo ""
	@echo "Frontend: http://localhost:3000"
	@echo "API: http://localhost:3001"
	@echo "Docs: http://localhost:3001/api/docs"
	@echo ""
	@echo "Default Credentials:"
	@echo "  Username: admin"
	@echo "  Password: admin123"
	@echo ""
	@echo "View logs: make logs"
	@echo "Stop: make down"
	@echo ""
