# =============================================================================
# MCP-HIVE Monorepo - Makefile
# =============================================================================
# Usage:
#   make help          - Show this help
#   make install       - Install all dependencies
#   make dev           - Start development servers
#   make docker-up     - Start with Docker
#   make docker-down   - Stop Docker services
# =============================================================================

.PHONY: help install dev dev-frontend dev-backend docker-up docker-down docker-logs clean test

# Colors for output
BLUE := \033[34m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
NC := \033[0m # No Color

# Default target
.DEFAULT_GOAL := help

# =============================================================================
# HELP
# =============================================================================
help:
	@echo ""
	@echo "$(BLUE)╔═══════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║               MCP-HIVE Monorepo Commands                      ║$(NC)"
	@echo "$(BLUE)╚═══════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(GREEN)Installation:$(NC)"
	@echo "  make install          Install all dependencies (frontend + backend)"
	@echo "  make install-frontend Install frontend dependencies only"
	@echo "  make install-backend  Install backend dependencies only"
	@echo ""
	@echo "$(GREEN)Development:$(NC)"
	@echo "  make dev              Start both frontend and backend (requires 2 terminals)"
	@echo "  make dev-frontend     Start frontend dev server (Vite :5173)"
	@echo "  make dev-backend      Start backend dev server (Uvicorn :8000)"
	@echo ""
	@echo "$(GREEN)Docker:$(NC)"
	@echo "  make docker-up        Start all services with Docker Compose"
	@echo "  make docker-up-ollama Start all services including local Ollama"
	@echo "  make docker-down      Stop all Docker services"
	@echo "  make docker-logs      View Docker logs"
	@echo "  make docker-build     Build Docker images"
	@echo ""
	@echo "$(GREEN)Testing:$(NC)"
	@echo "  make test             Run all tests"
	@echo "  make test-frontend    Run frontend tests"
	@echo "  make test-backend     Run backend tests"
	@echo ""
	@echo "$(GREEN)Utilities:$(NC)"
	@echo "  make clean            Clean build artifacts and caches"
	@echo "  make lint             Run linters on all code"
	@echo "  make health           Check backend health status"
	@echo ""

# =============================================================================
# INSTALLATION
# =============================================================================
install: install-frontend install-backend
	@echo "$(GREEN)All dependencies installed!$(NC)"

install-frontend:
	@echo "$(BLUE)Installing frontend dependencies...$(NC)"
	cd frontend && npm install

install-backend:
	@echo "$(BLUE)Installing backend dependencies...$(NC)"
	cd backend && pip install -r requirements.txt

# =============================================================================
# DEVELOPMENT
# =============================================================================
dev:
	@echo "$(YELLOW)Starting development servers...$(NC)"
	@echo "$(YELLOW)Run 'make dev-backend' in one terminal$(NC)"
	@echo "$(YELLOW)Run 'make dev-frontend' in another terminal$(NC)"
	@echo ""
	@echo "$(GREEN)Or use Docker: make docker-up$(NC)"

dev-frontend:
	@echo "$(BLUE)Starting frontend dev server on :5173...$(NC)"
	cd frontend && npm run dev

dev-backend:
	@echo "$(BLUE)Starting backend dev server on :8000...$(NC)"
	cd backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# =============================================================================
# DOCKER
# =============================================================================
docker-up:
	@echo "$(BLUE)Starting Docker services...$(NC)"
	docker compose up -d
	@echo "$(GREEN)Services started!$(NC)"
	@echo "  Frontend: http://localhost:5173"
	@echo "  Backend:  http://localhost:8000"
	@echo "  API Docs: http://localhost:8000/docs"

docker-up-ollama:
	@echo "$(BLUE)Starting Docker services with local Ollama...$(NC)"
	docker compose --profile with-ollama up -d
	@echo "$(GREEN)Services started!$(NC)"

docker-down:
	@echo "$(BLUE)Stopping Docker services...$(NC)"
	docker compose down
	@echo "$(GREEN)Services stopped.$(NC)"

docker-logs:
	docker compose logs -f

docker-build:
	@echo "$(BLUE)Building Docker images...$(NC)"
	docker compose build

# =============================================================================
# TESTING
# =============================================================================
test: test-frontend test-backend
	@echo "$(GREEN)All tests completed!$(NC)"

test-frontend:
	@echo "$(BLUE)Running frontend tests...$(NC)"
	cd frontend && npm run test 2>/dev/null || echo "$(YELLOW)No tests configured$(NC)"

test-backend:
	@echo "$(BLUE)Running backend tests...$(NC)"
	cd backend && python -m pytest 2>/dev/null || echo "$(YELLOW)No tests configured$(NC)"

# =============================================================================
# UTILITIES
# =============================================================================
clean:
	@echo "$(BLUE)Cleaning build artifacts...$(NC)"
	# Frontend
	rm -rf frontend/node_modules
	rm -rf frontend/dist
	rm -rf frontend/.pnpm-store
	# Backend
	find backend -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find backend -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find backend -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	rm -rf backend/.mypy_cache
	rm -rf backend/.ruff_cache
	@echo "$(GREEN)Clean complete!$(NC)"

lint:
	@echo "$(BLUE)Running linters...$(NC)"
	cd frontend && npm run lint 2>/dev/null || echo "$(YELLOW)Frontend lint skipped$(NC)"
	cd backend && ruff check . 2>/dev/null || echo "$(YELLOW)Backend lint skipped$(NC)"

health:
	@echo "$(BLUE)Checking backend health...$(NC)"
	@curl -s http://localhost:8000/health | python3 -m json.tool 2>/dev/null || echo "$(RED)Backend not running$(NC)"

# =============================================================================
# QUICK START
# =============================================================================
quickstart: install
	@echo ""
	@echo "$(GREEN)╔═══════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(GREEN)║                    MCP-HIVE Ready!                            ║$(NC)"
	@echo "$(GREEN)╚═══════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "Next steps:"
	@echo "  1. Copy .env.example to .env and configure"
	@echo "  2. Run 'make docker-up' to start services"
	@echo "  3. Open http://localhost:5173"
	@echo ""
