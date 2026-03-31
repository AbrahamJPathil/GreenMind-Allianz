#!/bin/bash

# GreenMind Docker Database Setup Script
# Sets up PostgreSQL and Redis using Docker Compose

echo "🚀 GreenMind Database Setup"
echo "=============================="
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "📁 Working directory: $SCRIPT_DIR"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first:"
    echo "   Ubuntu/Linux: curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh"
    echo "   macOS/Windows: Download from https://www.docker.com/products/docker-desktop/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Create .env file from example if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ .env file created"
    echo "⚠️  Please update passwords in .env file for production!"
    echo ""
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker compose down
echo ""

# Start Docker containers
echo "🐳 Starting PostgreSQL and Redis containers..."
docker compose up -d
echo ""

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check container status
echo "📊 Container Status:"
docker compose ps
echo ""

# Test PostgreSQL connection
echo "🔍 Testing PostgreSQL connection..."
if docker exec greenmind_postgres pg_isready -U greenmind_user -d greenmind_db > /dev/null 2>&1; then
    echo "✅ PostgreSQL is ready!"
else
    echo "❌ PostgreSQL connection failed"
fi

# Test Redis connection
echo "🔍 Testing Redis connection..."
if docker exec greenmind_redis redis-cli -a dev_redis_password PING > /dev/null 2>&1; then
    echo "✅ Redis is ready!"
else
    echo "❌ Redis connection failed"
fi

echo ""
echo "🎉 Setup Complete!"
echo ""
echo "📋 Service URLs:"
echo "   PostgreSQL:        localhost:5432"
echo "   Redis:             localhost:6379"
echo "   pgAdmin Web UI:    http://localhost:5050"
echo "   Redis Commander:   http://localhost:8081"
echo ""
echo "📝 Credentials (from .env file):"
echo "   PostgreSQL:"
echo "     Database: greenmind_db"
echo "     User:     greenmind_user"
echo "     Password: dev_password_change_in_prod"
echo ""
echo "   Redis:"
echo "     Password: dev_redis_password"
echo ""
echo "   pgAdmin:"
echo "     Email:    admin@greenmind.com"
echo "     Password: admin_password"
echo ""
echo "🔧 Next Steps:"
echo "   1. Install Python dependencies: pip install -r requirements_landing.txt"
echo "   2. Test database connection: python database.py"
echo "   3. Test Redis connection: python cache.py"
echo "   4. Start Flask app: python app_flask.py"
echo ""
echo "📖 For more details, see: DOCKER_DATABASE_SETUP.md"
echo ""
