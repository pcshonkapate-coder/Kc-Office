# Production Deployment Guide for Kapate OS

This guide details the operational standards, configuration requirements, database migration procedures, application server execution, reverse proxy setup, SSL/TLS termination, and rollback strategies for deploying **Kapate OS** to production environments.

---

## 1. Environment Configuration

Production environments must provide configuration through environment variables (or a secure `.env` file managed via AWS Secrets Manager, HashiCorp Vault, or Docker secrets).

### Required Environment Variables

| Variable | Type | Description | Production Example |
| :--- | :--- | :--- | :--- |
| `ENVIRONMENT` | String | Operating mode | `production` |
| `DEBUG` | Boolean | Disables debug mode & stack trace leaks | `false` |
| `SECRET_KEY` | String | Cryptographic signing key (min 64 chars) | `openssl rand -hex 32` |
| `ALGORITHM` | String | JWT signing algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Integer | Access token TTL in minutes | `60` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Integer | Refresh token TTL in days | `7` |
| `DATABASE_URL` | String | PostgreSQL database connection string | `postgresql://kapate_admin:<secret_pass>@db.internal:5432/kapate_os_prod` |
| `BACKEND_CORS_ORIGINS` | JSON Array | Whitelisted origins for API access | `["https://os.kapateconsultancy.com"]` |
| `FIRST_SUPERADMIN_EMAIL` | String | Initial superadmin user | `admin@kapateconsultancy.in` |
| `FIRST_SUPERADMIN_PASSWORD` | String | Initial superadmin password | `Admin@KC8421174957` |

> [!CAUTION]
> Never commit production secrets or `SECRET_KEY` values to version control. Set `DEBUG=false` in production so FastAPI suppresses unhandled exception stack traces and returns sanitized JSON error payloads with tracking `request_id`s.

---

## 2. Database Setup & Schema Auto-Migration

Kapate OS utilizes **SQLAlchemy Metadata Reflection** for multi-platform schema initialization and dynamic column sync.

### Initial Seed & Migration Command

```bash
# Set production env vars
export ENVIRONMENT=production
export DATABASE_URL="postgresql://kapate_admin:SECURE_PASS@db.internal:5432/kapate_os_prod"

# Run database table creation, dynamic column migration, and initial RBAC seed
python scripts/init_db.py
```

### Schema Integrity Verification

Before accepting user traffic, verify that all 27 standard RBAC permissions, default roles (`superadmin`, `partner`, `consultant`, `engineer`, `intern`, `freelancer`, `client`), and core schemas are seeded:

```bash
python -c "from app.db.session import engine; from sqlalchemy import inspect; print(inspect(engine).get_table_names())"
```

---

## 3. Web Server & Process Management (Gunicorn + Uvicorn)

Run FastAPI behind **Gunicorn** with **Uvicorn worker process classes** for high-concurrency event processing.

### Production Execution Command

```bash
gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 127.0.0.1:8000 \
  --access-logfile /var/log/kapate_os/access.log \
  --error-logfile /var/log/kapate_os/error.log \
  --log-level info \
  --graceful-timeout 30 \
  --keep-alive 5
```

### Systemd Service Setup (`/etc/systemd/system/kapate-os.service`)

```ini
[Unit]
Description=Kapate OS FastAPI Backend Engine
After=network.target postgresql.service

[Service]
User=kapate
Group=kapate
WorkingDirectory=/opt/kapate_os/backend
EnvironmentFile=/opt/kapate_os/backend/.env
ExecStart=/opt/kapate_os/backend/venv/bin/gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 127.0.0.1:8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now kapate-os
```

---

## 4. Reverse Proxy & SSL/TLS Configuration (Nginx)

Nginx should handle SSL termination, static file delivery, HTTP/2 enforcement, and proxying to Gunicorn.

### Nginx Site Configuration (`/etc/nginx/sites-available/kapate-os`)

```nginx
server {
    listen 80;
    server_name os.kapateconsultancy.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name os.kapateconsultancy.com;

    ssl_certificate /etc/letsencrypt/live/os.kapateconsultancy.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/os.kapateconsultancy.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Content-Security-Policy "default-src 'self' https:;" always;

    # Backend API Reverse Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 90s;
        client_max_body_size 50M;
    }

    # Static Website / Frontend
    location / {
        root /opt/kapate_os/frontend;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 5. Deployment Health Verification & Rollback Procedures

### Health Check Endpoints

```bash
# Verify system status
curl -i https://os.kapateconsultancy.com/api/v1/health

# Expected HTTP 200 JSON Response:
# {"status": "healthy", "app_name": "Kapate OS", "version": "0.1.0", "environment": "production", "database": {"status": "connected"}}
```

### Rollback Strategy

1. **Service Reversion**:
   ```bash
   # Revert application code to previous release commit / tag
   git checkout tags/v1.0.4
   sudo systemctl restart kapate-os
   ```

2. **Database Point-In-Time Restore**:
   If a migration failure occurs, trigger the standard database rollback:
   ```bash
   # Restore PostgreSQL snapshot
   pg_restore -U kapate_admin -d kapate_os_prod --clean /var/backups/kapate_os/pre_deploy_snapshot.dump
   ```
