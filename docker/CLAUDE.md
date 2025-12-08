# Docker & Deployment - Development Guidelines

## Purpose and Scope
This document covers Docker containerization, local development with Docker, testing in Docker environments, and deployment guidelines for the Simple Suppers v2 application.

## Docker Structure

### Docker Files
```
/
├── Dockerfile                   # Production build
├── Dockerfile.test              # Test environment
├── docker-compose.yml           # Development environment
├── docker-compose.test.yml      # Test environment
├── .dockerignore                # Files to exclude from build
├── docker/
│   └── postgres/
│       └── init.sql             # Database initialization
└── scripts/
    ├── wait-for-db.sh           # Wait for DB to be ready
    ├── seed-test-db.sh          # Seed test database
    └── reset-test-db.sh         # Reset test database
```

## Core Principles

### 1. Multi-Stage Builds
The production Dockerfile uses multi-stage builds for optimization:

```dockerfile
# Stage 1: Dependencies only
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Build application
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 3: Production runtime
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
# Copy only necessary files
COPY --from=builder /app/.next ./.next
COPY --from=deps /app/node_modules ./node_modules
```

### 2. Development vs Production
- **Development**: Hot reload, source maps, verbose logging
- **Production**: Optimized builds, minimal layers, security hardening

### 3. Environment Separation
- Local development: `docker-compose.yml`
- Testing: `docker-compose.test.yml`
- Production: Separate deployment configuration

## Docker Compose Configuration

### Development Environment

```yaml
# docker-compose.yml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: simple_suppers_dev
    ports:
      - "5433:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  # Next.js Application
  app:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/simple_suppers_dev
    ports:
      - "3010:3000"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - .:/app
      - /app/node_modules
      - /app/.next

volumes:
  postgres_data:

networks:
  app-network:
    driver: bridge
```

### Test Environment

```yaml
# docker-compose.test.yml
version: '3.8'

services:
  postgres-test:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: simple_suppers_test
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 2s
      timeout: 5s
      retries: 5

  test-runner:
    build:
      context: .
      dockerfile: Dockerfile.test
    environment:
      - NODE_ENV=test
      - DATABASE_URL=postgresql://postgres:postgres@postgres-test:5432/simple_suppers_test
    depends_on:
      postgres-test:
        condition: service_healthy
    command: npm test
```

## Common Docker Commands

### Development

```bash
# Build and start services
npm run docker:up
# or
docker-compose up -d

# View logs
npm run docker:logs
# or
docker-compose logs -f

# Stop services
npm run docker:down
# or
docker-compose down

# Rebuild containers
npm run docker:build
# or
docker-compose build --no-cache

# Clean up everything (including volumes)
npm run docker:clean
# or
docker-compose down -v
```

### Testing

```bash
# Run tests in Docker
npm run docker:test
# or
docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit

# Run specific test suite
docker-compose -f docker-compose.test.yml run test-runner npm test -- api

# Clean up test environment
npm run docker:test:down
# or
docker-compose -f docker-compose.test.yml down
```

### Database Management

```bash
# Access PostgreSQL
docker exec -it simple-suppers-db psql -U postgres -d simple_suppers_dev

# Reset database
docker-compose down -v
docker-compose up -d

# Backup database
docker exec simple-suppers-db pg_dump -U postgres simple_suppers_dev > backup.sql

# Restore database
docker exec -i simple-suppers-db psql -U postgres simple_suppers_dev < backup.sql
```

## Environment Variables

### Required Environment Variables

```bash
# .env.docker (for Docker environment)
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/simple_suppers_dev

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_SECRET_KEY=your_secret_key

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret
JWT_SECRET=your_jwt_secret

# API Keys
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=your_unsplash_key

# App Configuration
NEXT_PUBLIC_API_URL=http://localhost:3010
```

### Environment Files Priority
1. `.env.docker` - Docker-specific overrides
2. `.env.local` - Local development (not in Docker)
3. `.env` - Default values

## Dockerfile Best Practices

### 1. Use .dockerignore
```
# .dockerignore
node_modules
.next
.git
.env.local
*.log
__tests__
coverage
.vscode
README.md
```

### 2. Optimize Layer Caching
```dockerfile
# Copy package files first
COPY package*.json ./
RUN npm ci

# Then copy source code
COPY . .
```

### 3. Use Non-Root User
```dockerfile
# Create and use non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

USER nextjs
```

### 4. Multi-Stage for Size Reduction
Only copy necessary files to final stage:
```dockerfile
COPY --from=builder /app/.next ./.next
COPY --from=deps /app/node_modules ./node_modules
```

### 5. Health Checks
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js || exit 1
```

## Common Tasks

### Building for Production

```bash
# Build production image
docker build -t simple-suppers:latest .

# Run production container
docker run -p 3000:3000 \
  -e DATABASE_URL=$DATABASE_URL \
  -e NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL \
  simple-suppers:latest
```

### Running Tests in Docker

```bash
# Run all tests
npm run docker:test

# Run specific test project
docker-compose -f docker-compose.test.yml run test-runner \
  npm test -- --selectProjects=api

# Run tests with coverage
docker-compose -f docker-compose.test.yml run test-runner \
  npm run test:coverage
```

### Debugging in Docker

```bash
# Exec into running container
docker exec -it simple-suppers-app sh

# View container logs
docker logs -f simple-suppers-app

# Inspect container
docker inspect simple-suppers-app

# Check container stats
docker stats simple-suppers-app
```

### Database Migrations

```bash
# Run migrations
docker exec simple-suppers-app npx supabase db push

# Generate migration
docker exec simple-suppers-app npx supabase db diff --file migration_name

# Reset database
docker exec simple-suppers-app npm run db:reset
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Build and run tests
        run: |
          docker-compose -f docker-compose.test.yml up \
            --build \
            --abort-on-container-exit \
            --exit-code-from test-runner

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  build:
    runs-on: ubuntu-latest
    needs: test

    steps:
      - uses: actions/checkout@v3

      - name: Build production image
        run: docker build -t simple-suppers:${{ github.sha }} .

      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push simple-suppers:${{ github.sha }}
```

## Deployment Strategies

### 1. Container Registry
```bash
# Tag image
docker tag simple-suppers:latest registry.example.com/simple-suppers:latest

# Push to registry
docker push registry.example.com/simple-suppers:latest
```

### 2. Docker Swarm
```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.prod.yml simple-suppers

# Scale services
docker service scale simple-suppers_app=3
```

### 3. Kubernetes
```yaml
# k8s-deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: simple-suppers
spec:
  replicas: 3
  selector:
    matchLabels:
      app: simple-suppers
  template:
    metadata:
      labels:
        app: simple-suppers
    spec:
      containers:
      - name: app
        image: simple-suppers:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
```

## Performance Optimization

### 1. Use BuildKit
```bash
# Enable BuildKit
DOCKER_BUILDKIT=1 docker build -t simple-suppers .

# Use build cache from registry
docker build \
  --cache-from registry.example.com/simple-suppers:cache \
  -t simple-suppers .
```

### 2. Reduce Image Size
```dockerfile
# Use alpine base images
FROM node:18-alpine

# Remove unnecessary files
RUN npm prune --production

# Use .dockerignore effectively
```

### 3. Parallel Builds
```bash
# Build multiple services in parallel
docker-compose build --parallel
```

## Security Best Practices

### 1. Scan Images
```bash
# Scan for vulnerabilities
docker scan simple-suppers:latest

# Use Snyk
snyk container test simple-suppers:latest
```

### 2. Use Secrets
```bash
# Use Docker secrets (Swarm/Kubernetes)
echo "my-secret" | docker secret create db-password -

# Reference in compose file
secrets:
  db-password:
    external: true
```

### 3. Non-Root User
Always run as non-root user in production:
```dockerfile
USER nextjs
```

### 4. Read-Only Root Filesystem
```dockerfile
# In docker-compose.yml
services:
  app:
    read_only: true
    tmpfs:
      - /tmp
      - /app/.next/cache
```

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port
lsof -i :3010

# Kill process
kill -9 <PID>

# Or use different port
docker-compose up -d --scale app=1 -p 3011:3000
```

#### Container Won't Start
```bash
# Check logs
docker logs simple-suppers-app

# Inspect container
docker inspect simple-suppers-app

# Check health
docker ps --filter health=unhealthy
```

#### Database Connection Issues
```bash
# Verify database is running
docker ps | grep postgres

# Check network connectivity
docker exec simple-suppers-app ping postgres

# Verify environment variables
docker exec simple-suppers-app env | grep DATABASE
```

#### Build Failures
```bash
# Clear build cache
docker builder prune

# Build without cache
docker build --no-cache -t simple-suppers .

# Check .dockerignore
cat .dockerignore
```

## Monitoring and Logging

### Container Logs
```bash
# Follow logs
docker logs -f simple-suppers-app

# Last 100 lines
docker logs --tail 100 simple-suppers-app

# Since specific time
docker logs --since 2024-01-01T00:00:00 simple-suppers-app
```

### Resource Usage
```bash
# Real-time stats
docker stats

# Container resource limits
docker update --memory="2g" --cpus="2.0" simple-suppers-app
```

### Health Checks
```bash
# Check health status
docker inspect --format='{{.State.Health.Status}}' simple-suppers-app

# View health check logs
docker inspect --format='{{json .State.Health}}' simple-suppers-app | jq
```

## Development Workflow

### Recommended Workflow

1. **Start services**:
   ```bash
   npm run docker:up
   ```

2. **Verify services**:
   ```bash
   docker ps
   ```

3. **Make changes** (hot reload enabled)

4. **View logs**:
   ```bash
   npm run docker:logs
   ```

5. **Run tests**:
   ```bash
   npm run docker:test
   ```

6. **Stop services**:
   ```bash
   npm run docker:down
   ```

### Tips for Efficient Development

1. **Use volumes** for hot reload
2. **Mount node_modules** as separate volume
3. **Use healthchecks** for dependencies
4. **Keep .dockerignore** updated
5. **Use docker-compose** for multi-container setups

## Production Checklist

Before deploying to production:
- [ ] Environment variables configured
- [ ] Secrets properly managed
- [ ] Database migrations applied
- [ ] Health checks implemented
- [ ] Logs properly configured
- [ ] Resource limits set
- [ ] Security scan passed
- [ ] Backup strategy in place
- [ ] Monitoring configured
- [ ] SSL/TLS certificates ready
- [ ] Load balancing configured
- [ ] Auto-scaling configured (if applicable)

## Additional Resources

### Documentation
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Next.js Docker Guide](https://nextjs.org/docs/deployment#docker-image)

### Tools
- Docker Desktop
- Portainer (Container Management UI)
- Watchtower (Automated Updates)
- Traefik (Reverse Proxy)
