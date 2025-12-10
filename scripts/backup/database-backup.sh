#!/bin/bash

# Database Backup Script for MFO
# Performs PostgreSQL backup and uploads to S3

set -euo pipefail

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-mfo}"
DB_USER="${DB_USER:-mfo}"
BACKUP_BUCKET="${BACKUP_BUCKET:-mfo-backups}"
BACKUP_PREFIX="${BACKUP_PREFIX:-database}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="mfo_db_backup_${TIMESTAMP}.sql.gz"
TEMP_DIR="/tmp/db_backup"

# Logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >&2
}

# Cleanup on exit
cleanup() {
    rm -rf "${TEMP_DIR}"
}
trap cleanup EXIT

# Create temp directory
mkdir -p "${TEMP_DIR}"

log "Starting database backup..."

# Check required tools
for cmd in pg_dump aws gzip; do
    if ! command -v "$cmd" &> /dev/null; then
        error "$cmd is required but not installed"
        exit 1
    fi
done

# Perform database backup
log "Creating backup of database '${DB_NAME}'..."

PGPASSWORD="${DB_PASSWORD}" pg_dump \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    --format=plain \
    --no-owner \
    --no-acl \
    --verbose \
    2> "${TEMP_DIR}/pg_dump.log" | gzip > "${TEMP_DIR}/${BACKUP_FILE}"

if [ $? -ne 0 ]; then
    error "Database backup failed. Check ${TEMP_DIR}/pg_dump.log"
    cat "${TEMP_DIR}/pg_dump.log" >&2
    exit 1
fi

BACKUP_SIZE=$(du -h "${TEMP_DIR}/${BACKUP_FILE}" | cut -f1)
log "Backup created: ${BACKUP_FILE} (${BACKUP_SIZE})"

# Calculate checksum
CHECKSUM=$(sha256sum "${TEMP_DIR}/${BACKUP_FILE}" | cut -d' ' -f1)
echo "${CHECKSUM}" > "${TEMP_DIR}/${BACKUP_FILE}.sha256"
log "Checksum: ${CHECKSUM}"

# Upload to S3
log "Uploading backup to S3..."

aws s3 cp "${TEMP_DIR}/${BACKUP_FILE}" \
    "s3://${BACKUP_BUCKET}/${BACKUP_PREFIX}/${BACKUP_FILE}" \
    --storage-class STANDARD_IA \
    --metadata "checksum=${CHECKSUM},source=${DB_HOST},database=${DB_NAME}"

aws s3 cp "${TEMP_DIR}/${BACKUP_FILE}.sha256" \
    "s3://${BACKUP_BUCKET}/${BACKUP_PREFIX}/${BACKUP_FILE}.sha256"

log "Backup uploaded successfully"

# Create latest pointer
aws s3 cp "${TEMP_DIR}/${BACKUP_FILE}" \
    "s3://${BACKUP_BUCKET}/${BACKUP_PREFIX}/latest.sql.gz" \
    --storage-class STANDARD

# Cleanup old backups
log "Cleaning up backups older than ${RETENTION_DAYS} days..."

CUTOFF_DATE=$(date -d "-${RETENTION_DAYS} days" +%Y-%m-%d)

aws s3 ls "s3://${BACKUP_BUCKET}/${BACKUP_PREFIX}/" | while read -r line; do
    FILE_DATE=$(echo "$line" | awk '{print $1}')
    FILE_NAME=$(echo "$line" | awk '{print $4}')

    if [[ "$FILE_NAME" == mfo_db_backup_* ]] && [[ "$FILE_DATE" < "$CUTOFF_DATE" ]]; then
        log "Deleting old backup: $FILE_NAME"
        aws s3 rm "s3://${BACKUP_BUCKET}/${BACKUP_PREFIX}/${FILE_NAME}"
    fi
done

# Verify backup
log "Verifying backup integrity..."

aws s3 head-object \
    --bucket "${BACKUP_BUCKET}" \
    --key "${BACKUP_PREFIX}/${BACKUP_FILE}" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    log "Backup verification successful"
else
    error "Backup verification failed"
    exit 1
fi

# Report metrics
if [ -n "${METRICS_ENDPOINT:-}" ]; then
    curl -s -X POST "${METRICS_ENDPOINT}" \
        -H "Content-Type: application/json" \
        -d "{
            \"backup_type\": \"database\",
            \"timestamp\": \"${TIMESTAMP}\",
            \"size_bytes\": $(stat -f%z "${TEMP_DIR}/${BACKUP_FILE}" 2>/dev/null || stat -c%s "${TEMP_DIR}/${BACKUP_FILE}"),
            \"status\": \"success\"
        }"
fi

log "Database backup completed successfully!"
log "Backup location: s3://${BACKUP_BUCKET}/${BACKUP_PREFIX}/${BACKUP_FILE}"
