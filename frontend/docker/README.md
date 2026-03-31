# 🐳 Docker Setup for GreenMind

This folder contains all Docker-related files for setting up PostgreSQL and Redis locally.

## 📁 Files in This Folder

- **`docker-compose.yml`** - Docker Compose configuration for PostgreSQL, Redis, pgAdmin, and Redis Commander
- **`init-db.sql`** - Database initialization script with schema and sample data
- **`.env.example`** - Example environment variables (copy to `.env`)
- **`setup_docker_db.sh`** - Automated setup script
- **`DOCKER_DATABASE_SETUP.md`** - Complete documentation and troubleshooting guide

## 🚀 Quick Start (3 commands)

```bash
# 1. Navigate to docker folder
cd docker/

# 2. Copy environment file
cp .env.example .env

# 3. Run setup script
./setup_docker_db.sh
```

## 📊 What Gets Installed

| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 5432 | Main database |
| Redis | 6379 | Cache layer |
| pgAdmin | 5050 | PostgreSQL Web UI |
| Redis Commander | 8081 | Redis Web UI |

## 🔑 Default Credentials

**PostgreSQL:**
- Database: `greenmind_db`
- User: `greenmind_user`
- Password: `dev_password_change_in_prod`

**Redis:**
- Password: `dev_redis_password`

**pgAdmin:**
- Email: `admin@greenmind.com`
- Password: `admin_password`

## 📝 Common Commands

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f

# Check status
docker compose ps

# Restart a service
docker compose restart postgres
docker compose restart redis
```

## 🧪 Test Connection

From project root:

```bash
# Test database
python database.py

# Test cache
python cache.py

# Test Flask app
python app_flask.py
```

## 📖 Full Documentation

See **`DOCKER_DATABASE_SETUP.md`** for:
- Complete setup instructions
- Python integration examples
- Troubleshooting guide
- Backup and restore procedures
- Production deployment tips

## ⚠️ Important Notes

1. **Change passwords** in `.env` before deploying to production
2. **Don't commit** `.env` file to Git (already in `.gitignore`)
3. **Data persistence** - volumes are stored in Docker, use backups
4. **Port conflicts** - ensure ports 5432, 6379, 5050, 8081 are available

## 🔗 Integration

The `database.py` and `cache.py` files in the project root connect to these services.

Make sure to:
1. Install Python dependencies: `pip install -r requirements_landing.txt`
2. Start Docker services: `./setup_docker_db.sh`
3. Run your Flask app: `python app_flask.py`

---

**Need help?** Check the full documentation in `DOCKER_DATABASE_SETUP.md`
