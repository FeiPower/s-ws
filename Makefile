# Makefile for SpiralNav UI Docker operations

.PHONY: help dev prod build clean logs shell test up down restart

# Default target
help:
	@echo "SpiralNav UI - Docker Commands"
	@echo "==============================="
	@echo ""
	@echo "Development:"
	@echo "  make dev          - Start development server with hot reload"
	@echo "  make dev-build    - Rebuild and start development server"
	@echo "  make shell        - Access development container shell"
	@echo ""
	@echo "Production:"
	@echo "  make prod         - Start production server"
	@echo "  make prod-build   - Build production image"
	@echo "  make nginx        - Start with NGINX reverse proxy"
	@echo ""
	@echo "Management:"
	@echo "  make logs         - View logs (add SERVICE=spiral-dev for specific)"
	@echo "  make restart      - Restart containers"
	@echo "  make down         - Stop all containers"
	@echo "  make clean        - Remove containers, volumes, and images"
	@echo ""
	@echo "Utilities:"
	@echo "  make test         - Run tests in container"
	@echo "  make check        - Run TypeScript checks"
	@echo "  make ps           - Show running containers"
	@echo ""

# Development commands
dev:
	docker-compose up spiral-dev

dev-build:
	docker-compose up --build spiral-dev

dev-bg:
	docker-compose up -d spiral-dev

# Production commands
prod:
	docker-compose --profile production up spiral-prod

prod-build:
	docker-compose --profile production build spiral-prod

prod-bg:
	docker-compose --profile production up -d spiral-prod

nginx:
	docker-compose --profile nginx up -d

# Management commands
logs:
	@if [ -z "$(SERVICE)" ]; then \
		docker-compose logs -f; \
	else \
		docker-compose logs -f $(SERVICE); \
	fi

shell:
	docker-compose exec spiral-dev sh

down:
	docker-compose down

restart:
	docker-compose restart $(SERVICE)

ps:
	docker-compose ps

# Utility commands
test:
	docker-compose exec spiral-dev npm test

check:
	docker-compose exec spiral-dev npm run astro check

build-check:
	docker-compose exec spiral-dev npm run build

# Clean up commands
clean:
	@echo "Stopping containers..."
	docker-compose down -v
	@echo "Removing images..."
	docker-compose down --rmi all
	@echo "Cleaning up..."
	docker system prune -f

clean-all:
	@echo "⚠️  This will remove ALL containers, volumes, and images!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v --rmi all; \
		docker system prune -af --volumes; \
	fi

# Install/setup
setup:
	@echo "Setting up SpiralNav UI..."
	@if [ ! -f .env ]; then \
		cp .env.docker .env; \
		echo "✓ Created .env file"; \
	fi
	@echo "✓ Setup complete! Run 'make dev' to start"

# Quick commands
up: dev-bg
	@echo "✓ Development server started in background"
	@echo "Access at: http://localhost:4321"

stop: down

rebuild: clean dev-build

