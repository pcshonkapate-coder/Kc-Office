# Enterprise Backup & Disaster Recovery Strategy

This document defines the automated backup, point-in-time recovery (PITR), document storage backup, and disaster recovery protocol for **Kapate OS**.

---

## 1. Backup Scope & Objectives

| Parameter | Operational Standard | Description |
| :--- | :--- | :--- |
| **Recovery Point Objective (RPO)** | 5 Minutes | Maximum acceptable data loss duration |
| **Recovery Time Objective (RTO)** | 30 Minutes | Maximum downtime permitted to restore full operations |
| **Retention Policy** | 30 Days Daily, 12 Months Monthly | Compliance & audit retention requirements |
| **Encryption** | AES-256 | All backup archives encrypted at rest |

---

## 2. PostgreSQL Automated Backup Script (`/opt/kapate_os/scripts/backup_db.sh`)

```bash
#!/usr/bin/env bash
set -euo pipefail

# Configuration
BACKUP_DIR="/var/backups/kapate_os/database"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="kapate_os_prod"
DB_USER="kapate_admin"
PASSPHRASE_FILE="/etc/kapate_os/backup_encryption.key"
RETENTION_DAYS=30

mkdir -p "${BACKUP_DIR}"

BACKUP_FILE="${BACKUP_DIR}/kapate_db_${DATE}.dump"
ENCRYPTED_FILE="${BACKUP_FILE}.enc"

echo "[$(date)] Starting PostgreSQL database dump..."
pg_dump -U "${DB_USER}" -h localhost -F c -b -v -f "${BACKUP_FILE}" "${DB_NAME}"

echo "[$(date)] Encrypting backup with AES-256..."
openssl enc -aes-256-cbc -salt -pbkdf2 -in "${BACKUP_FILE}" -out "${ENCRYPTED_FILE}" -pass "file:${PASSPHRASE_FILE}"

rm -f "${BACKUP_FILE}"

echo "[$(date)] Cleaning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -type f -name "*.dump.enc" -mtime +${RETENTION_DAYS} -delete

echo "[$(date)] Backup completed successfully: ${ENCRYPTED_FILE}"
```

Make executable:
```bash
chmod +x /opt/kapate_os/scripts/backup_db.sh
```

---

## 3. Document & Contract File Storage Backup (`/opt/kapate_os/scripts/backup_documents.sh`)

Contracts, invoices, NDA PDFs, and uploaded client documents are stored in local document vaults or S3 buckets.

```bash
#!/usr/bin/env bash
set -euo pipefail

DOCS_DIR="/var/lib/kapate_os/documents"
BACKUP_DIR="/var/backups/kapate_os/documents"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Archiving uploaded document vault..."
tar -czf "${BACKUP_DIR}/docs_backup_${DATE}.tar.gz" -C "${DOCS_DIR}" .

# Retain 30 days
find "${BACKUP_DIR}" -type f -name "*.tar.gz" -mtime +30 -delete
echo "[$(date)] Document archive completed."
```

---

## 4. Automated Cron Schedule (`/etc/cron.d/kapate_os_backups`)

```cron
# Kapate OS Backup Cron Schedules

# 1. Database Full Backup every night at 2:00 AM
0 2 * * * root /opt/kapate_os/scripts/backup_db.sh >> /var/log/kapate_os/db_backup.log 2>&1

# 2. Document Vault Sync every night at 3:00 AM
0 3 * * * root /opt/kapate_os/scripts/backup_documents.sh >> /var/log/kapate_os/doc_backup.log 2>&1

# 3. Offsite Cloud Sync (AWS S3) at 4:00 AM
0 4 * * * root aws s3 sync /var/backups/kapate_os/ s3://kapate-os-encrypted-backups/ --delete >> /var/log/kapate_os/s3_sync.log 2>&1
```

---

## 5. Restoration & Recovery Protocol

### Database Restoration Procedure

```bash
# 1. Decrypt backup file
openssl enc -d -aes-256-cbc -pbkdf2 -in /var/backups/kapate_os/database/kapate_db_20260916_020000.dump.enc -out /tmp/restore.dump -pass file:/etc/kapate_os/backup_encryption.key

# 2. Drop existing connections & restore DB
pg_restore -U kapate_admin -h localhost -d kapate_os_prod --clean --create /tmp/restore.dump

# 3. Wipe temporary unencrypted file
rm -f /tmp/restore.dump
```

### Document Vault Restoration Procedure

```bash
# Uncompress archive to document storage directory
tar -xzf /var/backups/kapate_os/documents/docs_backup_20260916_030000.tar.gz -C /var/lib/kapate_os/documents/
```
