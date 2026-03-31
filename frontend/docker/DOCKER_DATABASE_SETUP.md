# 🐳 Docker Database Setup Guide
## PostgreSQL & Redis for Local Development

**Version:** 1.0  
**Date:** November 12, 2025  
**Purpose:** Set up PostgreSQL and Redis in Docker containers for local caching and development

---

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Quick Start (5 minutes)](#quick-start)
3. [Docker Compose Setup](#docker-compose-setup)
4. [Database Configuration](#database-configuration)
5. [Python Integration](#python-integration)
6. [Testing & Verification](#testing-verification)
7. [Common Commands](#common-commands)
8. [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

### 1. Install Docker Desktop

**Ubuntu/Linux:**
```bash
# Update packages
sudo apt-get update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group (no sudo needed)
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo apt-get install docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

**macOS:**
```bash
# Download and install Docker Desktop from:
# https://www.docker.com/products/docker-desktop/

# Verify installation
docker --version
docker compose version
```

**Windows:**
```bash
# Download and install Docker Desktop from:
# https://www.docker.com/products/docker-desktop/

# Enable WSL 2 backend
# Verify in PowerShell:
docker --version
docker compose version
```

---

## 🚀 Quick Start (5 minutes)

### Step 1: Navigate to Docker Folder

All Docker-related files are in the `docker/` folder:

```bash
cd docker/
```

The `docker-compose.yml` file is already created:

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:16-alpine
    container_name: greenmind_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: greenmind_db
      POSTGRES_USER: greenmind_user
      POSTGRES_PASSWORD: dev_password_change_in_prod
      POSTGRES_HOST_AUTH_METHOD: scram-sha-256
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U greenmind_user -d greenmind_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: greenmind_redis
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass dev_redis_password
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Commander (Web UI for Redis)
  redis-commander:
    image: rediscommander/redis-commander:latest
    container_name: greenmind_redis_ui
    restart: unless-stopped
    environment:
      - REDIS_HOSTS=local:greenmind_redis:6379:0:dev_redis_password
    ports:
      - "8081:8081"
    depends_on:
      - redis

  # pgAdmin (Web UI for PostgreSQL)
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: greenmind_pgadmin
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@greenmind.com
      PGADMIN_DEFAULT_PASSWORD: admin_password
      PGADMIN_CONFIG_SERVER_MODE: 'False'
    ports:
      - "5050:80"
    volumes:
      - pgadmin_data:/var/lib/pgadmin
    depends_on:
      - postgres

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  pgadmin_data:
    driver: local
```

### Step 2: Database Initialization Script

The `init-db.sql` file is already created in the docker folder:

```sql
-- GreenMind Database Schema Initialization
-- Creates all necessary tables, indexes, and relationships

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For text search

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- Calculator history table
CREATE TABLE IF NOT EXISTS calculator_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    calculation_type VARCHAR(50) NOT NULL,
    input_data JSONB NOT NULL,
    output_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_calc_user_id ON calculator_history(user_id);
CREATE INDEX IF NOT EXISTS idx_calc_created_at ON calculator_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calc_type ON calculator_history(calculation_type);
CREATE INDEX IF NOT EXISTS idx_calc_input_data ON calculator_history USING GIN(input_data);

-- Cloud provider pricing cache table
CREATE TABLE IF NOT EXISTS cloud_pricing_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider VARCHAR(50) NOT NULL,
    region VARCHAR(100) NOT NULL,
    instance_type VARCHAR(100) NOT NULL,
    pricing_data JSONB NOT NULL,
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    UNIQUE(provider, region, instance_type)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pricing_provider ON cloud_pricing_cache(provider);
CREATE INDEX IF NOT EXISTS idx_pricing_expires ON cloud_pricing_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_pricing_composite ON cloud_pricing_cache(provider, region, instance_type);

-- Carbon intensity cache table
CREATE TABLE IF NOT EXISTS carbon_intensity_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    region VARCHAR(100) NOT NULL,
    carbon_intensity DECIMAL(10, 4) NOT NULL,
    data_source VARCHAR(100) NOT NULL,
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    UNIQUE(region, data_source)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_carbon_region ON carbon_intensity_cache(region);
CREATE INDEX IF NOT EXISTS idx_carbon_expires ON carbon_intensity_cache(expires_at);

-- User sessions table (for auth tokens)
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    user_agent TEXT,
    ip_address INET
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);

-- API request logs (for rate limiting and analytics)
CREATE TABLE IF NOT EXISTS api_request_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET
);

-- Create indexes for analytics
CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON api_request_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_user_id ON api_request_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_endpoint ON api_request_logs(endpoint);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to users table
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO users (email, password_hash, full_name) VALUES
    ('test@greenmind.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYCJIaC1LiW', 'Test User')
ON CONFLICT (email) DO NOTHING;

-- Create view for user statistics
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    u.id,
    u.email,
    u.full_name,
    COUNT(ch.id) as total_calculations,
    MAX(ch.created_at) as last_calculation,
    COUNT(CASE WHEN ch.created_at > NOW() - INTERVAL '7 days' THEN 1 END) as calculations_last_week
FROM users u
LEFT JOIN calculator_history ch ON u.id = ch.user_id
GROUP BY u.id, u.email, u.full_name;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database initialized successfully!';
    RAISE NOTICE 'Tables created: users, calculator_history, cloud_pricing_cache, carbon_intensity_cache, user_sessions, api_request_logs';
    RAISE NOTICE 'Sample user created: test@greenmind.com (password: testpassword123)';
END $$;
```

### Step 3: Create Environment Configuration

Copy the example environment file:

```bash
# From the docker/ folder
cp .env.example .env

# Or from project root
cp docker/.env.example docker/.env
```

The `.env` file contains:

```bash
# Database Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=greenmind_db
POSTGRES_USER=greenmind_user
POSTGRES_PASSWORD=dev_password_change_in_prod

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=dev_redis_password
REDIS_DB=0

# Application Configuration
DATABASE_URL=postgresql://greenmind_user:dev_password_change_in_prod@localhost:5432/greenmind_db
REDIS_URL=redis://:dev_redis_password@localhost:6379/0

# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=dev-secret-key-change-in-production

# Cache Settings
CACHE_TYPE=redis
CACHE_REDIS_URL=redis://:dev_redis_password@localhost:6379/0
CACHE_DEFAULT_TIMEOUT=300
```

### Step 4: Start the Services

```bash
# Navigate to docker folder
cd docker/

# Start all services in background
docker compose up -d

# Check if services are running
docker compose ps

# View logs
docker compose logs -f

# Check specific service logs
docker compose logs -f postgres
docker compose logs -f redis
```

---

## 🐍 Python Integration

### 1. Install Required Packages

Update `requirements.txt`:

```txt
# Existing packages
Flask==3.0.0
flask-cors==4.0.0

# Database & Cache
psycopg2-binary==2.9.9
SQLAlchemy==2.0.23
alembic==1.13.0
redis==5.0.1
Flask-Caching==2.1.0

# Data validation
pydantic==2.5.0
python-dotenv==1.0.0

# Background tasks
APScheduler==3.10.4

# HTTP clients
httpx==0.25.2
aioredis==2.0.1
```

Install:
```bash
pip install -r requirements.txt
```

### 2. Create Database Connection Module

Create `database.py`:

```python
"""Database connection and session management"""
import os
from contextlib import contextmanager
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy.pool import QueuePool
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database configuration
DATABASE_URL = os.getenv('DATABASE_URL', 
    'postgresql://greenmind_user:dev_password_change_in_prod@localhost:5432/greenmind_db')

# Create engine with connection pooling
engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,  # Verify connections before using
    pool_recycle=3600,   # Recycle connections after 1 hour
    echo=False           # Set to True for SQL query logging
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create thread-safe scoped session
ScopedSession = scoped_session(SessionLocal)

# Base class for models
Base = declarative_base()

@contextmanager
def get_db():
    """Context manager for database sessions"""
    db = ScopedSession()
    try:
        yield db
        db.commit()
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()

def get_db_session():
    """Get database session (for dependency injection)"""
    db = ScopedSession()
    try:
        yield db
    finally:
        db.close()

# Database health check
def check_database_connection():
    """Check if database is accessible"""
    try:
        with engine.connect() as conn:
            conn.execute("SELECT 1")
        return True
    except Exception as e:
        print(f"Database connection failed: {e}")
        return False

# Initialize database tables
def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)
    print("Database tables initialized successfully!")

if __name__ == "__main__":
    # Test database connection
    if check_database_connection():
        print("✅ Database connection successful!")
        init_db()
    else:
        print("❌ Database connection failed!")
```

### 3. Create Redis Cache Module

Create `cache.py`:

```python
"""Redis cache configuration and utilities"""
import os
import json
import redis
from functools import wraps
from typing import Optional, Any, Callable
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Redis configuration
REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
REDIS_PORT = int(os.getenv('REDIS_PORT', 6379))
REDIS_PASSWORD = os.getenv('REDIS_PASSWORD', 'dev_redis_password')
REDIS_DB = int(os.getenv('REDIS_DB', 0))

# Create Redis client
redis_client = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    password=REDIS_PASSWORD,
    db=REDIS_DB,
    decode_responses=True,
    socket_connect_timeout=5,
    socket_timeout=5,
    retry_on_timeout=True
)

class CacheManager:
    """Redis cache manager with helper methods"""
    
    def __init__(self, client: redis.Redis = redis_client):
        self.client = client
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        try:
            value = self.client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            print(f"Cache get error: {e}")
            return None
    
    def set(self, key: str, value: Any, ttl: int = 300) -> bool:
        """Set value in cache with TTL (seconds)"""
        try:
            serialized = json.dumps(value)
            return self.client.setex(key, ttl, serialized)
        except Exception as e:
            print(f"Cache set error: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        """Delete key from cache"""
        try:
            return bool(self.client.delete(key))
        except Exception as e:
            print(f"Cache delete error: {e}")
            return False
    
    def exists(self, key: str) -> bool:
        """Check if key exists"""
        try:
            return bool(self.client.exists(key))
        except Exception as e:
            print(f"Cache exists error: {e}")
            return False
    
    def clear_pattern(self, pattern: str) -> int:
        """Delete all keys matching pattern"""
        try:
            keys = self.client.keys(pattern)
            if keys:
                return self.client.delete(*keys)
            return 0
        except Exception as e:
            print(f"Cache clear pattern error: {e}")
            return 0
    
    def get_ttl(self, key: str) -> int:
        """Get remaining TTL for key"""
        try:
            return self.client.ttl(key)
        except Exception as e:
            print(f"Cache TTL error: {e}")
            return -1

# Global cache instance
cache = CacheManager(redis_client)

def cached(ttl: int = 300, key_prefix: str = ""):
    """Decorator for caching function results"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = f"{key_prefix}:{func.__name__}:{str(args)}:{str(kwargs)}"
            
            # Try to get from cache
            cached_value = cache.get(cache_key)
            if cached_value is not None:
                return cached_value
            
            # Execute function and cache result
            result = func(*args, **kwargs)
            cache.set(cache_key, result, ttl=ttl)
            return result
        
        return wrapper
    return decorator

def check_redis_connection() -> bool:
    """Check if Redis is accessible"""
    try:
        redis_client.ping()
        return True
    except Exception as e:
        print(f"Redis connection failed: {e}")
        return False

# Example usage functions
def cache_cloud_pricing(provider: str, region: str, data: dict, ttl: int = 3600):
    """Cache cloud pricing data"""
    key = f"pricing:{provider}:{region}"
    return cache.set(key, data, ttl=ttl)

def get_cached_pricing(provider: str, region: str) -> Optional[dict]:
    """Get cached pricing data"""
    key = f"pricing:{provider}:{region}"
    return cache.get(key)

def cache_carbon_intensity(region: str, data: dict, ttl: int = 1800):
    """Cache carbon intensity data"""
    key = f"carbon:{region}"
    return cache.set(key, data, ttl=ttl)

def get_cached_carbon(region: str) -> Optional[dict]:
    """Get cached carbon intensity"""
    key = f"carbon:{region}"
    return cache.get(key)

if __name__ == "__main__":
    # Test Redis connection
    if check_redis_connection():
        print("✅ Redis connection successful!")
        
        # Test cache operations
        cache.set("test_key", {"message": "Hello Redis!"}, ttl=60)
        result = cache.get("test_key")
        print(f"Cache test: {result}")
        
        # Test decorator
        @cached(ttl=10, key_prefix="demo")
        def expensive_function(x: int) -> int:
            print("Executing expensive function...")
            return x ** 2
        
        print(f"First call: {expensive_function(5)}")
        print(f"Second call (cached): {expensive_function(5)}")
    else:
        print("❌ Redis connection failed!")
```

### 4. Update Flask App

Update `app_flask.py`:

```python
"""Flask application with PostgreSQL and Redis integration"""
import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

# Import database and cache modules
from database import check_database_connection, get_db, init_db
from cache import check_redis_connection, cache, cached

# Load environment variables
load_dotenv()

# Create Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')

# Enable CORS
CORS(app)

# Initialize database on startup
with app.app_context():
    if check_database_connection():
        print("✅ Database connected successfully!")
        init_db()
    else:
        print("⚠️  Database connection failed - running without database")

# Check Redis connection
if check_redis_connection():
    print("✅ Redis connected successfully!")
else:
    print("⚠️  Redis connection failed - caching disabled")

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    """Check if all services are healthy"""
    return jsonify({
        'status': 'healthy',
        'database': check_database_connection(),
        'redis': check_redis_connection()
    })

# Example: Cached API endpoint
@app.route('/api/v1/calculator/cloud-pricing', methods=['GET'])
@cached(ttl=3600, key_prefix="api")
def get_cloud_pricing():
    """Get cloud pricing data (cached for 1 hour)"""
    provider = request.args.get('provider', 'aws')
    region = request.args.get('region', 'us-east-1')
    
    # This would normally fetch from external API
    # For now, return mock data
    pricing_data = {
        'provider': provider,
        'region': region,
        'instances': [
            {'type': 't3.medium', 'vcpu': 2, 'memory': 4, 'price_per_hour': 0.0416},
            {'type': 't3.large', 'vcpu': 2, 'memory': 8, 'price_per_hour': 0.0832}
        ],
        'cached': True
    }
    
    return jsonify(pricing_data)

# Example: Database query endpoint
@app.route('/api/v1/calculator/history', methods=['GET'])
def get_calculator_history():
    """Get user's calculator history from database"""
    # This would normally query the database
    # For now, return mock data
    return jsonify({
        'history': [
            {
                'id': '123',
                'type': 'hardware_carbon',
                'timestamp': '2025-11-12T10:00:00Z',
                'result': {'carbon_saved': 1250}
            }
        ]
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
```

---

## ✅ Testing & Verification

### 1. Test Services

```bash
# Check if all containers are running
docker compose ps

# Expected output:
# NAME                    STATUS              PORTS
# greenmind_postgres      Up (healthy)        0.0.0.0:5432->5432/tcp
# greenmind_redis         Up (healthy)        0.0.0.0:6379->6379/tcp
# greenmind_pgadmin       Up                  0.0.0.0:5050->80/tcp
# greenmind_redis_ui      Up                  0.0.0.0:8081->8081/tcp
```

### 2. Test PostgreSQL

```bash
# Connect to PostgreSQL
docker exec -it greenmind_postgres psql -U greenmind_user -d greenmind_db

# Inside PostgreSQL:
\dt                                    # List all tables
SELECT * FROM users;                   # Query users
\q                                     # Exit
```

Or use **pgAdmin Web UI**:
- Open: http://localhost:5050
- Login: admin@greenmind.com / admin_password
- Add server: Host=postgres, Port=5432, User=greenmind_user

### 3. Test Redis

```bash
# Connect to Redis
docker exec -it greenmind_redis redis-cli -a dev_redis_password

# Inside Redis:
PING                                   # Should return PONG
SET test "Hello Redis"                 # Set a key
GET test                               # Get the key
KEYS *                                 # List all keys
exit                                   # Exit
```

Or use **Redis Commander Web UI**:
- Open: http://localhost:8081
- View all keys, values, and TTLs

### 4. Test Python Integration

```bash
# Test database connection
python database.py

# Test cache connection
python cache.py

# Run Flask app
python app_flask.py

# Test health endpoint
curl http://localhost:5000/health
```

---

## 📚 Common Commands

### Docker Compose Commands

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# Stop and remove volumes (deletes data!)
docker compose down -v

# View logs
docker compose logs -f

# Restart specific service
docker compose restart postgres
docker compose restart redis

# Rebuild containers
docker compose up -d --build

# Check resource usage
docker stats
```

### Database Backup & Restore

```bash
# Backup PostgreSQL database
docker exec greenmind_postgres pg_dump -U greenmind_user greenmind_db > backup.sql

# Restore PostgreSQL database
docker exec -i greenmind_postgres psql -U greenmind_user greenmind_db < backup.sql

# Backup Redis data
docker exec greenmind_redis redis-cli -a dev_redis_password SAVE
docker cp greenmind_redis:/data/dump.rdb ./redis_backup.rdb

# Restore Redis data
docker cp ./redis_backup.rdb greenmind_redis:/data/dump.rdb
docker compose restart redis
```

### Cache Management

```bash
# Clear all Redis cache
docker exec greenmind_redis redis-cli -a dev_redis_password FLUSHALL

# Clear specific pattern
docker exec greenmind_redis redis-cli -a dev_redis_password --eval "return redis.call('del', unpack(redis.call('keys', ARGV[1])))" , 'pricing:*'

# View cache statistics
docker exec greenmind_redis redis-cli -a dev_redis_password INFO stats
```

---

## 🔍 Troubleshooting

### Issue 1: Port Already in Use

```bash
# Check what's using the port
sudo lsof -i :5432  # PostgreSQL
sudo lsof -i :6379  # Redis

# Kill the process or change port in docker-compose.yml
ports:
  - "5433:5432"  # Use different host port
```

### Issue 2: Permission Denied

```bash
# Fix Docker permissions
sudo usermod -aG docker $USER
newgrp docker

# Fix file permissions
chmod +x init-db.sql
```

### Issue 3: Connection Refused

```bash
# Check if containers are running
docker compose ps

# Check container logs
docker compose logs postgres
docker compose logs redis

# Restart services
docker compose restart
```

### Issue 4: Database Not Initialized

```bash
# Recreate database with initialization
docker compose down -v
docker compose up -d

# Check initialization logs
docker compose logs postgres | grep "Database initialized"
```

### Issue 5: Redis Authentication Failed

```bash
# Make sure password matches in:
# 1. docker-compose.yml (REDIS_PASSWORD)
# 2. .env file (REDIS_PASSWORD)
# 3. Python code (cache.py)

# Test connection
docker exec greenmind_redis redis-cli -a dev_redis_password PING
```

---

## 🎯 Next Steps

### 1. Implement API Endpoints with Caching

```python
from cache import cached, cache
from database import get_db

@app.route('/api/v1/calculator/recommendations', methods=['POST'])
@cached(ttl=300, key_prefix="recommendations")
def get_recommendations():
    data = request.json
    
    # Check cache first
    cache_key = f"rec:{data['workload']}:{data['region']}"
    cached_result = cache.get(cache_key)
    if cached_result:
        return jsonify(cached_result)
    
    # Calculate recommendations
    recommendations = calculate_recommendations(data)
    
    # Cache result
    cache.set(cache_key, recommendations, ttl=300)
    
    # Save to database
    with get_db() as db:
        # Save calculation history
        pass
    
    return jsonify(recommendations)
```

### 2. Set Up Background Data Updates

```python
from apscheduler.schedulers.background import BackgroundScheduler
import httpx

scheduler = BackgroundScheduler()

@scheduler.scheduled_job('interval', hours=1)
def update_cloud_pricing():
    """Update cloud pricing cache every hour"""
    # Fetch from free APIs
    # Update Redis cache
    pass

scheduler.start()
```

### 3. Production Considerations

When moving to production:
- ✅ Use managed PostgreSQL (Railway, Supabase, AWS RDS)
- ✅ Use managed Redis (Upstash, Redis Cloud free tier)
- ✅ Change all passwords and secrets
- ✅ Enable SSL/TLS connections
- ✅ Set up automated backups
- ✅ Monitor connection pools and cache hit rates

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   Flask Application                      │
│                     (Port 5000)                          │
└───────────────┬─────────────────┬───────────────────────┘
                │                 │
                │                 │
       ┌────────▼────────┐   ┌───▼──────────────┐
       │   PostgreSQL    │   │      Redis       │
       │   (Port 5432)   │   │   (Port 6379)    │
       │                 │   │                  │
       │ ┌─────────────┐ │   │ ┌──────────────┐ │
       │ │   Users     │ │   │ │  Pricing     │ │
       │ │   History   │ │   │ │  Cache       │ │
       │ │   Sessions  │ │   │ │  Session     │ │
       │ └─────────────┘ │   │ └──────────────┘ │
       └─────────────────┘   └──────────────────┘
                │                     │
                │                     │
       ┌────────▼────────┐   ┌───────▼──────────┐
       │    pgAdmin      │   │ Redis Commander  │
       │  (Port 5050)    │   │   (Port 8081)    │
       │   Web UI        │   │    Web UI        │
       └─────────────────┘   └──────────────────┘
```

---

## 🎉 You're All Set!

Your local development environment now has:
- ✅ PostgreSQL for persistent data storage
- ✅ Redis for high-speed caching
- ✅ pgAdmin for database management
- ✅ Redis Commander for cache monitoring
- ✅ Python integration with SQLAlchemy & Redis
- ✅ Health checks and error handling
- ✅ Easy backup and restore procedures

**Start developing with confidence! 🚀**

For production deployment, refer to `API_INTEGRATION_PLAN_V2.md` for cost-optimized cloud hosting options.
