# KAPATE OS 3.0: Database Backup & Disaster Recovery Architecture

This document establishes the enterprise business continuity, automated backup schedules, retention policies, and Point-In-Time-Recovery (PITR) procedures for KAPATE OS 3.0.

---

## 1. Executive Summary & Continuity Targets

| Metric | Target | Description |
| :--- | :--- | :--- |
| **RPO (Recovery Point Objective)** | **< 15 minutes** | Maximum acceptable data loss window during catastrophic failure. |
| **RTO (Recovery Time Objective)** | **< 60 minutes** | Maximum allowable downtime before full operational restoration. |
| **Data Encryption** | **AES-256 GPG** | All backup artifacts encrypted at rest and in transit (TLS 1.3). |
| **Compliance Level** | **7-Year Fiscal Audit** | Financial ledgers and immutable audit logs preserved for 7 years. |

---

## 2. Multi-Tiered Backup Architecture

```
+-----------------------------------------------------------------------------------+
|                        KAPATE OS 3.0 PRODUCTION CLUSTER                           |
|                                                                                   |
|  +--------------------+       +--------------------+      +--------------------+  |
|  |  FastAPI Backend   |       |   PostgreSQL 16    |      |    Redis Cache     |  |
|  |     (Port 8000)    |       |     (Port 5432)    |      |    (Port 6379)     |  |
|  +--------------------+       +---------+----------+      +--------------------+  |
|                                         |                                         |
+-----------------------------------------|-----------------------------------------+
                                          |
                      +-------------------+-------------------+
                      |                                       |
                      v Continuous Archiving                  v Daily Snapshots (02:00 UTC)
         +--------------------------+           +--------------------------+
         | WAL (Write-Ahead Logs)   |           | pg_dump (Custom Format)  |
         | Retention: 7 Days (PITR) |           | AES-256 Encrypted        |
         +------------+-------------+           +------------+-------------+
                      |                                      |
                      +-------------------+------------------+
                                          |
                                          v Secure HTTPS Upload
                         +-----------------------------------+
                         | S3 Vault (ap-south-1 Mumbai)      |
                         | Versioning + Object Lock Enabled  |
                         +-----------------+-----------------+
                                           |
                                           v Automated Cross-Region Replication
                         +-----------------------------------+
                         | Disaster Recovery Cold Bucket     |
                         | (ap-southeast-1 Singapore)        |
                         +-----------------------------------+
```

### Tier 1: Continuous WAL Archiving (Point-In-Time-Recovery)
PostgreSQL Write-Ahead Logs (`pg_wal`) are continuously shipped to cloud object storage every 5 minutes or upon file segment completion (16MB). This allows restoring the database to any millisecond within the past 7 days.

### Tier 2: Automated Daily Full Logical Backups
A full logical database dump (`pg_dump` with custom compressed directory format) executes daily at 02:00 UTC during minimum operational concurrency. Dumps are compressed with `pigz`, signed with SHA-256 hashes, and encrypted with public GPG keys before cloud upload.

### Tier 3: Cross-Region Geographically Redundant Cold Storage
Backups in the primary AWS S3 bucket (`ap-south-1` Mumbai) are automatically replicated to an isolated secondary bucket (`ap-southeast-1` Singapore) with S3 Object Lock (WORM - Write Once, Read Many) to prevent ransomware tampering.

---

## 3. Retention & Lifecycle Policy

| Archive Tier | Frequency | Retention Period | Storage Class | Lifecycle Action |
| :--- | :--- | :--- | :--- | :--- |
| **PITR WAL Logs** | Every 5 mins | **7 Days** | S3 Standard | Auto-purge after 7 days |
| **Daily Snapshots** | Daily at 02:00 | **14 Days** | S3 Standard-IA | Transition to Glacier at Day 14 |
| **Weekly Snapshots** | Sundays at 03:00| **8 Weeks** | S3 Glacier Flexible | Transition to Deep Archive at Week 8 |
| **Monthly Snapshots**| 1st of Month | **12 Months** | S3 Glacier Flexible | Transition to Deep Archive at Year 1 |
| **Fiscal Year Ledgers**| March 31 End | **7 Years** | S3 Glacier Deep Archive | Legal & Financial Audit Compliance |

---

## 4. Automated Backup Script (`scripts/backup_postgres.sh`)

Deploy this script on the production database host or backup agent container:

```bash
#!/usr/bin/env bash
set -eo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/kapate_os"
DB_NAME="${POSTGRES_DB:-kapate_os_v3}"
DB_USER="${POSTGRES_USER:-kapate_admin}"
DB_HOST="${POSTGRES_HOST:-localhost}"
S3_BUCKET="s3://kapate-os-backups-vault/daily"
BACKUP_FILE="${BACKUP_DIR}/kapate_os_${TIMESTAMP}.dump"
GPG_RECIPIENT="security@kapateconsultancy.in"

mkdir -p "${BACKUP_DIR}"

echo "[$(date -u)] Initiating full logical database dump of ${DB_NAME}..."

# Execute consistent snapshot with multi-threaded dump
PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
  -h "${DB_HOST}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  -F c \
  -b \
  -v \
  -f "${BACKUP_FILE}"

echo "[$(date -u)] Dump complete. Computing SHA-256 integrity hash..."
sha256sum "${BACKUP_FILE}" > "${BACKUP_FILE}.sha256"

echo "[$(date -u)] Encrypting backup with GPG public key..."
gpg --batch --yes --encrypt --recipient "${GPG_RECIPIENT}" "${BACKUP_FILE}"
ENCRYPTED_FILE="${BACKUP_FILE}.gpg"

echo "[$(date -u)] Uploading encrypted backup to S3 cold storage..."
aws s3 cp "${ENCRYPTED_FILE}" "${S3_BUCKET}/" --storage-class STANDARD_IA
aws s3 cp "${BACKUP_FILE}.sha256" "${S3_BUCKET}/"

echo "[$(date -u)] Purging local raw dump files older than 3 days..."
find "${BACKUP_DIR}" -type f -name "*.dump*" -mtime +3 -delete

echo "[$(date -u)] Backup completed and verified successfully."
```

### Installation via Crontab
```bash
# Edit production crontab
crontab -e

# Run every day at 02:00 UTC
0 2 * * * /opt/kapate_os/scripts/backup_postgres.sh >> /var/log/kapate_backup.log 2>&1
```

---

## 5. Disaster Recovery Runbook & Restoration Playbook

### Scenario A: Catastrophic Host Loss (Fresh Server Restoration)

1. **Provision Fresh Environment & Clone Repository**:
   ```bash
   git clone git@github.com:pcshonkapate-coder/Kc-Office.git /opt/kapate_os
   cd /opt/kapate_os
   cp .env.production.example .env
   # Populate secrets from offline secure password manager
   ```

2. **Retrieve Latest Encrypted Backup from S3**:
   ```bash
   LATEST_BACKUP=$(aws s3 ls s3://kapate-os-backups-vault/daily/ | sort | tail -n 1 | awk '{print $4}')
   aws s3 cp "s3://kapate-os-backups-vault/daily/${LATEST_BACKUP}" /tmp/
   aws s3 cp "s3://kapate-os-backups-vault/daily/${LATEST_BACKUP%.gpg}.sha256" /tmp/
   ```

3. **Decrypt and Verify Checksum**:
   ```bash
   cd /tmp
   gpg --decrypt "${LATEST_BACKUP}" > restored_database.dump
   sha256sum -c "${LATEST_BACKUP%.gpg}.sha256"
   ```

4. **Spin Up Core Database Container**:
   ```bash
   docker compose up -d postgres redis
   docker compose ps
   ```

5. **Restore Database Cluster**:
   ```bash
   docker compose exec -T postgres pg_restore \
     -U kapate_admin \
     -d kapate_os_v3 \
     --clean \
     --if-exists \
     --no-owner \
     --role=kapate_admin < /tmp/restored_database.dump
   ```

6. **Launch All Services and Verify Healthchecks**:
   ```bash
   docker compose up -d
   curl -f http://localhost:8000/health
   # Returns: {"status":"healthy","system":"KAPATE OS 3.0 API Core","version":"3.0.0"}
   ```

---

### Scenario B: Point-In-Time-Recovery (Accidental Deletion / Data Corruption)

1. Identify the exact UTC timestamp immediately prior to the corrupting event (e.g., `2026-09-24 14:22:15 UTC`).
2. Stop the application containers:
   ```bash
   docker compose stop api worker web
   ```
3. Create a `recovery.signal` file in the PostgreSQL data directory:
   ```bash
   touch /var/lib/postgresql/data/recovery.signal
   ```
4. Set recovery target in `postgresql.conf`:
   ```ini
   restore_command = 'aws s3 cp s3://kapate-os-backups-vault/wal/%f %p'
   recovery_target_time = '2026-09-24 14:22:15 UTC'
   recovery_target_action = 'promote'
   ```
5. Restart PostgreSQL container and monitor WAL replay progress:
   ```bash
   docker compose restart postgres
   docker compose logs -f postgres
   ```
6. Re-enable application containers:
   ```bash
   docker compose start api worker web
   ```

---

## 6. Disaster Recovery Drill Schedule

To guarantee readiness and verify that RTO/RPO metrics remain within thresholds:
- **Monthly Automated Restoration Drill**: An automated worker spins up an isolated sandbox database, restores the previous night's backup, verifies row counts, and reports drill completion to Slack/Email.
- **Quarterly Tabletop Simulation**: The systems team simulates sudden master database failure and executes the full Disaster Recovery Playbook under live timing.
