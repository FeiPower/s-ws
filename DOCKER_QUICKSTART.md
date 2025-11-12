# 🐳 Docker Quick Start - SpiralNav UI

Get the Fibonacci spiral running in Docker in **under 2 minutes**!

## Prerequisites

- **Docker Desktop** installed ([Download here](https://www.docker.com/products/docker-desktop))
- Docker Desktop running
- 2GB free disk space

## Method 1: One-Command Start (Easiest)

### Windows (PowerShell)
```powershell
.\start.ps1
```

### Linux/Mac
```bash
./start.sh
```

Choose option **1** for development mode, then open: **http://localhost:4321**

## Method 2: Docker Compose

```bash
# Development mode (with hot reload)
docker-compose up spiral-dev
```

Open: **http://localhost:4321**

## Method 3: Make Commands (Linux/Mac)

```bash
# Start development server
make dev

# Or start in background
make up
```

## What You'll See

1. **First time**: Docker will build the image (~2-3 minutes)
2. **Subsequent starts**: Fast startup (~10 seconds)
3. **Browser**: Open http://localhost:4321 to see the spiral!

## Quick Commands Reference

| Command | What it does |
|---------|-------------|
| `docker-compose up spiral-dev` | Start dev server (foreground) |
| `docker-compose up -d spiral-dev` | Start dev server (background) |
| `docker-compose down` | Stop all containers |
| `docker-compose logs -f` | View logs |
| `docker-compose exec spiral-dev sh` | Access container shell |

## Configuration

Edit `.env` file to customize:

```env
# Use Canvas (default) or WebGL renderer
PUBLIC_RENDERER=canvas

# Set your form endpoint
PUBLIC_FORM_ENDPOINT=https://formspree.io/f/YOUR_ID
```

Then restart:
```bash
docker-compose restart spiral-dev
```

## Advantages of Docker

✅ **No npm install issues** - Dependencies installed in container  
✅ **Consistent environment** - Works the same everywhere  
✅ **Easy cleanup** - Just delete containers  
✅ **Isolated** - Won't conflict with other projects  
✅ **Production-ready** - Same setup for dev and prod  

## Hot Reload

The development container has hot reload enabled! Edit files in:
- `src/` - Auto-reloads
- `public/` - Static assets
- Config files - Auto-reloads

Changes appear instantly in the browser.

## Stopping

### Foreground mode (if running with `up`)
Press **Ctrl+C**

### Background mode
```bash
docker-compose down
```

## Troubleshooting

### Port Already in Use
```bash
# Check what's using port 4321
# Windows:
netstat -ano | findstr :4321

# Linux/Mac:
lsof -i :4321

# Change port in docker-compose.yml or kill the process
```

### Container Won't Start
```bash
# View logs
docker-compose logs spiral-dev

# Rebuild
docker-compose up --build spiral-dev
```

### Performance Issues
Switch to Canvas renderer in `.env`:
```env
PUBLIC_RENDERER=canvas
```

## Full Documentation

For detailed Docker usage, see: **[DOCKER.md](./DOCKER.md)**

For application docs, see: **[README.md](./README.md)**

## Next Steps

1. ✅ **Running?** Great! Now explore the spiral
2. 📝 **Customize**: Edit `src/content/sections/*.md` to add content
3. 🎨 **Theme**: Modify `tailwind.config.cjs` for colors
4. 🚀 **Deploy**: Use production mode for deployment

---

**That's it! You're running SpiralNav UI in Docker! 🌀🐳**

Questions? Check [DOCKER.md](./DOCKER.md) for detailed documentation.

