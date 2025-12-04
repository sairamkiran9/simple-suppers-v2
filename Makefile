.PHONY: help docker-build docker-up docker-down docker-test docker-test-watch docker-logs docker-clean

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

docker-build: ## Build Docker images
	docker-compose -f docker-compose.yml build
	docker-compose -f docker-compose.test.yml build

docker-up: ## Start development environment
	docker-compose -f docker-compose.yml up -d
	@echo "Waiting for services to be ready..."
	@sleep 5
	@echo "Services are running!"
	@echo "App: http://localhost:3010"
	@echo "Database: localhost:5433"

docker-down: ## Stop all services
	docker-compose -f docker-compose.yml down
	docker-compose -f docker-compose.test.yml down

docker-test: ## Run tests in Docker
	docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit
	docker-compose -f docker-compose.test.yml down

docker-test-watch: ## Run tests in watch mode
	docker-compose -f docker-compose.test.yml run --rm test-runner npm run test:watch

docker-logs: ## Show logs from all services
	docker-compose -f docker-compose.yml logs -f

docker-logs-test: ## Show test logs
	docker-compose -f docker-compose.test.yml logs -f

docker-clean: ## Remove all containers, volumes, and images
	docker-compose -f docker-compose.yml down -v
	docker-compose -f docker-compose.test.yml down -v
	docker system prune -f

docker-db-shell: ## Open PostgreSQL shell
	docker exec -it simple-suppers-db psql -U postgres -d simple_suppers_dev

docker-db-test-shell: ## Open test PostgreSQL shell
	docker exec -it simple-suppers-test-db psql -U postgres -d simple_suppers_test

docker-seed: ## Seed development database
	bash scripts/seed-test-db.sh

docker-reset: ## Reset test database
	bash scripts/reset-test-db.sh

# CI simulation
ci-test: ## Run tests exactly as CI does
	docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit --exit-code-from test-runner
	docker-compose -f docker-compose.test.yml down

# Dev Container commands
devcontainer-build: ## Build dev container
	docker-compose -f .devcontainer/docker-compose.yml build

devcontainer-up: ## Start dev container services
	docker-compose -f .devcontainer/docker-compose.yml up -d

devcontainer-down: ## Stop dev container services
	docker-compose -f .devcontainer/docker-compose.yml down

devcontainer-logs: ## Show dev container logs
	docker-compose -f .devcontainer/docker-compose.yml logs -f

devcontainer-clean: ## Clean dev container volumes
	docker-compose -f .devcontainer/docker-compose.yml down -v
