#!/bin/bash
# Quick start script for SpiralNav UI in Docker

set -e

echo "🌀 SpiralNav UI - Docker Quick Start"
echo "===================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed!"
    echo "Please install Docker from: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker daemon is not running!"
    echo "Please start Docker Desktop or the Docker service"
    exit 1
fi

echo "✓ Docker is installed and running"

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found, creating from .env.docker..."
    if [ -f .env.docker ]; then
        cp .env.docker .env
    else
        cat > .env << 'ENVEOF'
PUBLIC_RENDERER=canvas
PUBLIC_FORM_ENDPOINT=https://formspree.io/f/YOUR_FORM_ID
NODE_ENV=development
HOST=0.0.0.0
PORT=4321
ENVEOF
    fi
    echo "✓ Created .env file"
fi

echo ""
echo "Choose mode:"
echo "  1) Development (hot reload, port 4321)"
echo "  2) Production (optimized, port 4322)"
echo "  3) Development in background"
echo "  4) Stop all containers"
echo ""
read -p "Enter choice [1-4]: " choice

case $choice in
    1)
        echo ""
        echo "🚀 Starting development server..."
        echo "Access at: http://localhost:4321"
        echo "Press Ctrl+C to stop"
        echo ""
        docker-compose up spiral-dev
        ;;
    2)
        echo ""
        echo "🚀 Starting production server..."
        echo "Access at: http://localhost:4322"
        echo "Press Ctrl+C to stop"
        echo ""
        docker-compose --profile production up spiral-prod
        ;;
    3)
        echo ""
        echo "🚀 Starting development server in background..."
        docker-compose up -d spiral-dev
        echo "✓ Server started!"
        echo ""
        echo "Access at: http://localhost:4321"
        echo "View logs: docker-compose logs -f spiral-dev"
        echo "Stop: docker-compose down"
        ;;
    4)
        echo ""
        echo "🛑 Stopping all containers..."
        docker-compose down
        echo "✓ All containers stopped"
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

