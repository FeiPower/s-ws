# Docker Guide - SpiralNav UI

Complete guide for running SpiralNav UI in Docker containers.

## Quick Start

### 1. Development Mode (with hot reload)

```bash
# Start development container
docker-compose up spiral-dev

# Or run in background
docker-compose up -d spiral-dev
```

Access at: **http://localhost:4321**

### 2. Production Mode

```bash
# Build and start production container
docker-compose --profile production up spiral-prod

# Or run in background
docker-compose --profile production up -d spiral-prod
```

Access at: **http://localhost:4322**

### 3. Production with NGINX

```bash
# Start production with NGINX reverse proxy
docker-compose --profile nginx up

# Access at: http://localhost (port 80)
```

## Prerequisites

- Docker 20.10+ ([Install Docker](https://docs.docker.com/get-docker/))
- Docker Compose 2.0+ (included with Docker Desktop)
- 2GB free disk space
- 512MB available RAM

## Configuration

### Environment Variables

Create `.env` file from template:

```bash
cp .env.docker .env
```

Edit `.env`:

```env
# Renderer: 'canvas' (default) or 'webgl'
PUBLIC_RENDERER=canvas

# Form endpoint
PUBLIC_FORM_ENDPOINT=https://formspree.io/f/YOUR_FORM_ID

# Node environment
NODE_ENV=development
```

## Docker Commands

### Development

```bash
# Start dev server with hot reload
docker-compose up spiral-dev

# Rebuild and start
docker-compose up --build spiral-dev

# Stop
docker-compose down

# View logs
docker-compose logs -f spiral-dev

# Execute commands in container
docker-compose exec spiral-dev npm run astro check
```

### Production

```bash
# Build production image
docker-compose --profile production build spiral-prod

# Start production
docker-compose --profile production up -d spiral-prod

# View logs
docker-compose --profile production logs -f spiral-prod

# Stop
docker-compose --profile production down
```

### Direct Docker Commands

```bash
# Build development image
docker build -f Dockerfile.dev -t spiralnav:dev .

# Build production image
docker build -t spiralnav:prod .

# Run development container
docker run -p 4321:4321 -v $(pwd)/src:/app/src spiralnav:dev

# Run production container
docker run -p 4321:4321 spiralnav:prod
```

## Project Structure

```
spiral-site/
├── Dockerfile              # Production multi-stage build
├── Dockerfile.dev          # Development with hot reload
├── docker-compose.yml      # Service definitions
├── docker-compose.override.yml  # Local overrides
├── .dockerignore           # Files to exclude from build
├── nginx.conf              # NGINX configuration
└── .env                    # Environment variables
```

## Development Workflow

### 1. Initial Setup

```bash
# Clone/navigate to project
cd spiral-site

# Create environment file
cp .env.docker .env

# Start development container
docker-compose up spiral-dev
```

### 2. Development with Hot Reload

The dev container has volume mounts for:
- `src/` - Source code (hot reload enabled)
- `public/` - Static assets
- Config files (astro.config.mjs, tailwind.config.cjs, etc.)

**Edit files locally** → **Changes reflect immediately in container**

### 3. Adding Dependencies

```bash
# Option 1: Execute in container
docker-compose exec spiral-dev npm install package-name

# Option 2: Stop container, add to package.json, rebuild
docker-compose down
# Edit package.json
docker-compose up --build spiral-dev
```

### 4. Running Commands

```bash
# Type checking
docker-compose exec spiral-dev npm run astro check

# Build
docker-compose exec spiral-dev npm run build

# Access shell
docker-compose exec spiral-dev sh
```

## Production Deployment

### 1. Build Optimized Image

```bash
docker-compose --profile production build spiral-prod
```

This creates a multi-stage build:
- **Stage 1**: Install deps and build
- **Stage 2**: Copy only built assets (smaller image)

### 2. Test Locally

```bash
docker-compose --profile production up spiral-prod
```

Open: http://localhost:4322

### 3. Deploy to Production

#### Docker Hub

```bash
# Tag image
docker tag spiralnav-prod:latest yourusername/spiralnav:latest

# Push to Docker Hub
docker push yourusername/spiralnav:latest

# Pull and run on server
docker pull yourusername/spiralnav:latest
docker run -d -p 80:4321 yourusername/spiralnav:latest
```

#### Docker Registry

```bash
# Tag for private registry
docker tag spiralnav-prod:latest registry.example.com/spiralnav:latest

# Push
docker push registry.example.com/spiralnav:latest
```

## NGINX Reverse Proxy

### Why Use NGINX?

- **SSL/TLS termination**
- **Static file caching**
- **Load balancing**
- **Security headers**
- **Gzip compression**

### Setup

1. **Configure SSL certificates** (optional):

```bash
mkdir ssl
# Copy your SSL certificates
cp cert.pem ssl/
cp key.pem ssl/
```

2. **Edit nginx.conf** to enable HTTPS section

3. **Start with NGINX**:

```bash
docker-compose --profile nginx up -d
```

Access at:
- HTTP: http://localhost
- HTTPS: https://localhost (if configured)

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs spiral-dev

# Common issues:
# - Port 4321 already in use
# - Missing .env file
# - Syntax error in docker-compose.yml
```

### Port Already in Use

```bash
# Check what's using port 4321
# Linux/Mac:
lsof -i :4321

# Windows:
netstat -ano | findstr :4321

# Change port in docker-compose.yml:
ports:
  - "4325:4321"  # Use different external port
```

### Hot Reload Not Working

```bash
# Ensure volumes are mounted correctly
docker-compose config

# Restart container
docker-compose restart spiral-dev

# Check file permissions (Linux/Mac)
ls -la src/
```

### Build Fails

```bash
# Clean rebuild
docker-compose down
docker-compose build --no-cache spiral-dev
docker-compose up spiral-dev
```

### Container Crashes

```bash
# Check health status
docker-compose ps

# View full logs
docker-compose logs --tail=100 spiral-dev

# Check resource usage
docker stats spiralnav-dev
```

## Performance Optimization

### Reduce Build Time

```bash
# Use BuildKit
DOCKER_BUILDKIT=1 docker-compose build

# Multi-stage caching
# Already configured in Dockerfile
```

### Reduce Image Size

Current sizes:
- **Development**: ~500MB (includes dev dependencies)
- **Production**: ~200MB (optimized multi-stage build)

Further optimization:
```dockerfile
# Use alpine base (already done)
FROM node:18-alpine

# Remove unnecessary files
RUN npm prune --production
```

### Memory Limits

```yaml
# In docker-compose.yml
services:
  spiral-dev:
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/docker.yml
name: Docker Build

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: docker build -t spiralnav:latest .
      
      - name: Run tests
        run: docker run spiralnav:latest npm test
```

### GitLab CI

```yaml
# .gitlab-ci.yml
build:
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -t spiralnav:latest .
    - docker push $CI_REGISTRY_IMAGE:latest
```

## Advanced Usage

### Multi-Container Setup

```yaml
# Add database, Redis, etc.
services:
  spiral-dev:
    # ... existing config
    depends_on:
      - redis
  
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```

### Custom Networking

```yaml
networks:
  frontend:
  backend:

services:
  spiral-dev:
    networks:
      - frontend
      - backend
```

### Secrets Management

```bash
# Use Docker secrets (Swarm mode)
echo "my_secret_value" | docker secret create form_endpoint -

# Reference in compose:
services:
  spiral-prod:
    secrets:
      - form_endpoint
```

## Maintenance

### Clean Up

```bash
# Stop and remove containers
docker-compose down

# Remove volumes too
docker-compose down -v

# Clean up unused images
docker image prune -a

# Full system cleanup
docker system prune -a --volumes
```

### Updates

```bash
# Pull latest base images
docker-compose pull

# Rebuild with latest
docker-compose build --pull

# Restart services
docker-compose up -d
```

## Monitoring

### Health Checks

Already configured in Dockerfile:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s \
  CMD node -e "require('http').get('http://localhost:4321'...)"
```

Check status:

```bash
docker-compose ps
# Shows health status
```

### Resource Usage

```bash
# Monitor in real-time
docker stats spiralnav-dev

# Detailed info
docker inspect spiralnav-dev
```

## Security Best Practices

1. **Non-root user** (TODO: add to Dockerfile)
2. **Scan for vulnerabilities**:
   ```bash
   docker scan spiralnav:prod
   ```
3. **Keep base images updated**
4. **Use multi-stage builds** (already done)
5. **Minimal attack surface** (alpine base)

## FAQ

**Q: Do I need to rebuild after changing .env?**  
A: No, restart is enough: `docker-compose restart`

**Q: Can I run both dev and prod simultaneously?**  
A: Yes! They use different ports (4321 vs 4322)

**Q: How do I switch between Canvas and WebGL?**  
A: Change `PUBLIC_RENDERER` in `.env` and restart

**Q: Does hot reload work in Docker?**  
A: Yes! Volume mounts enable hot reload in dev mode

**Q: How much disk space does this use?**  
A: ~700MB total (images + containers + volumes)

## Support

For Docker-specific issues:
- Check logs: `docker-compose logs`
- Verify config: `docker-compose config`
- Test connectivity: `docker-compose exec spiral-dev ping host.docker.internal`

For app issues, see main `README.md` and `DEVELOPMENT.md`.

---

**Happy containerizing! 🐳🌀**

