# PowerShell Quick Start Script for SpiralNav UI in Docker

Write-Host "🌀 SpiralNav UI - Docker Quick Start" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
$dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerInstalled) {
    Write-Host "❌ Docker is not installed!" -ForegroundColor Red
    Write-Host "Please install Docker Desktop from: https://docs.docker.com/desktop/install/windows-install/"
    exit 1
}

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✓ Docker is installed and running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker daemon is not running!" -ForegroundColor Red
    Write-Host "Please start Docker Desktop"
    exit 1
}

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "⚠️  .env file not found, creating..." -ForegroundColor Yellow
    if (Test-Path .env.docker) {
        Copy-Item .env.docker .env
    } else {
        @"
PUBLIC_RENDERER=canvas
PUBLIC_FORM_ENDPOINT=https://formspree.io/f/YOUR_FORM_ID
NODE_ENV=development
HOST=0.0.0.0
PORT=4321
"@ | Out-File -FilePath .env -Encoding utf8
    }
    Write-Host "✓ Created .env file" -ForegroundColor Green
}

Write-Host ""
Write-Host "Choose mode:"
Write-Host "  1) Development (hot reload, port 4321)"
Write-Host "  2) Production (optimized, port 4322)"
Write-Host "  3) Development in background"
Write-Host "  4) Stop all containers"
Write-Host ""
$choice = Read-Host "Enter choice [1-4]"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🚀 Starting development server..." -ForegroundColor Green
        Write-Host "Access at: http://localhost:4321"
        Write-Host "Press Ctrl+C to stop"
        Write-Host ""
        docker-compose up spiral-dev
    }
    "2" {
        Write-Host ""
        Write-Host "🚀 Starting production server..." -ForegroundColor Green
        Write-Host "Access at: http://localhost:4322"
        Write-Host "Press Ctrl+C to stop"
        Write-Host ""
        docker-compose --profile production up spiral-prod
    }
    "3" {
        Write-Host ""
        Write-Host "🚀 Starting development server in background..." -ForegroundColor Green
        docker-compose up -d spiral-dev
        Write-Host "✓ Server started!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Access at: http://localhost:4321"
        Write-Host "View logs: docker-compose logs -f spiral-dev"
        Write-Host "Stop: docker-compose down"
    }
    "4" {
        Write-Host ""
        Write-Host "🛑 Stopping all containers..." -ForegroundColor Yellow
        docker-compose down
        Write-Host "✓ All containers stopped" -ForegroundColor Green
    }
    default {
        Write-Host "Invalid choice" -ForegroundColor Red
        exit 1
    }
}

