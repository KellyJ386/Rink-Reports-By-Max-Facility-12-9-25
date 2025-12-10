#!/bin/bash

# Database Restore Script for MFO
# Restores PostgreSQL database from S3 backup

set -euo pipefail

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-mfo}"
DB_USER="${DB_USER:-mfo}"
BACKUP_BUCKET="${BACKUP_BUCKET:-mfo-backups}"
BACKUP_PREFIX="${BACKUP_PREFIX:-database}"
TEMP_DIR="/tmp/db_restore"

# Parse arguments
BACKUP_FILE="${1:-latest.sql.gz}"
DRY_RUN="${DRY_RUN:-false}"
FORCE="${FORCE:-false}"

# Logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >&2
}

warn() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1" >&2
}

# Cleanup on exit
cleanup() {
    rm -rf "${TEMP_DIR}"
}
trap cleanup EXIT

# Usage
usage() {
    cat << EOF
Usage: $0 [BACKUP_FILE] [OPTIONS]

Arguments:
  BACKUP_FILE    Name of backup file in S3 (default: latest.sql.gz)

Environment Variables:
  DB_HOST        Database host (default: localhost)
  DB_PORT        Database port (default: 5432)
  DB_NAME        Database name (default: mfo)
  DB_USER        Database user (default: mfo)
  DB_PASSWORD    Database password (required)
  BACKUP_BUCKET  S3 bucket name (default: mfo-backups)
  DRY_RUN        If true, download and verify but don't restore (default: false)
  FORCE          If true, skip confirmation (default: false)

Examples:
  $0                                    # Restore latest backup
  $0 mfo_db_backup_20241210_120000.sql.gz  # Restore specific backup
  DRY_RUN=true $0                       # Verify backup without restoring

EOF
    exit 1
}

if [[ "${1:-}" == "-h" ]] || [[ "${1:-}" == "--help" ]]; then
    usage
fi

# Create temp directory
mkdir -p "${TEMP_DIR}"

log "Starting database restore..."
log "Backup file: ${BACKUP_FILE}"
log "Target database: ${DB_NAME}@${DB_HOST}:${DB_PORT}"

# Check required tools
for cmd in psql aws gunzip; do
    if ! command -v "$cmd" &> /dev/null; then
        error "$cmd is required but not installed"
        exit 1
    fi
done

# Confirmation
if [[ "$FORCE" != "true" ]] && [[ "$DRY_RUN" != "true" ]]; then
    warn "This will OVERWRITE the database '${DB_NAME}'!"
    read -p "Are you sure you want to continue? (yes/no): " CONFIRM
    if [[ "$CONFIRM" != "yes" ]]; then
        log "Restore cancelled"
        exit 0
    fi
fi

# List available backups
log "Available backups:"
aws s3 ls "s3://${BACKUP_BUCKET}/${BACKUP_PREFIX}/" --human-readable | grep -E "\.sql\.gz$" | tail -10

# Download backup
log "Downloading backup from S3..."

aws s3 cp "s3://${BACKUP_BUCKET}/${BACKUP_PREFIX}/${BACKUP_FILE}" \
    "${TEMP_DIR}/${BACKUP_FILE}"

# Download checksum if available
CHECKSUM_FILE="${BACKUP_FILE}.sha256"
if aws s3 ls "s3://${BACKUP_BUCKET}/${BACKUP_PREFIX}/${CHECKSUM_FILE}" &> /dev/null; then
    aws s3 cp "s3://${BACKUP_BUCKET}/${BACKUP_PREFIX}/${CHECKSUM_FILE}" \
        "${TEMP_DIR}/${CHECKSUM_FILE}"

    log "Verifying checksum..."
    EXPECTED_CHECKSUM=$(cat "${TEMP_DIR}/${CHECKSUM_FILE}")
    ACTUAL_CHECKSUM=$(sha256sum "${TEMP_DIR}/${BACKUP_FILE}" | cut -d' ' -f1)

    if [[ "$EXPECTED_CHECKSUM" != "$ACTUAL_CHECKSUM" ]]; then
        error "Checksum mismatch!"
        error "Expected: ${EXPECTED_CHECKSUM}"
        error "Actual: ${ACTUAL_CHECKSUM}"
        exit 1
    fi
    log "Checksum verified"
else
    warn "No checksum file found, skipping verification"
fi

# Decompress
log "Decompressing backup..."
gunzip -c "${TEMP_DIR}/${BACKUP_FILE}" > "${TEMP_DIR}/restore.sql"

BACKUP_SIZE=$(du -h "${TEMP_DIR}/restore.sql" | cut -f1)
log "Decompressed size: ${BACKUP_SIZE}"

# Dry run check
if [[ "$DRY_RUN" == "true" ]]; then
    log "Dry run mode - verifying backup structure..."

    # Check for expected tables
    EXPECTED_TABLES=("users" "facilities" "bookings" "maintenance_tasks")
    for table in "${EXPECTED_TABLES[@]}"; do
        if grep -q "CREATE TABLE.*${table}" "${TEMP_DIR}/restore.sql"; then
            log "  Found table: ${table}"
        else
            warn "  Missing table: ${table}"
        fi
    done

    log "Dry run completed - backup appears valid"
    exit 0
fi

# Create pre-restore backup
log "Creating pre-restore backup..."
PGPASSWORD="${DB_PASSWORD}" pg_dump \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    --format=custom \
    -f "${TEMP_DIR}/pre_restore_backup.dump" 2>/dev/null || warn "Could not create pre-restore backup"

# Restore database
log "Restoring database..."

# Drop existing connections
PGPASSWORD="${DB_PASSWORD}" psql \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d postgres \
    -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();" \
    2>/dev/null || true

# Drop and recreate database
PGPASSWORD="${DB_PASSWORD}" psql \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d postgres \
    -c "DROP DATABASE IF EXISTS ${DB_NAME};"

PGPASSWORD="${DB_PASSWORD}" psql \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d postgres \
    -c "CREATE DATABASE ${DB_NAME};"

# Restore from backup
PGPASSWORD="${DB_PASSWORD}" psql \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    -f "${TEMP_DIR}/restore.sql" \
    --single-transaction \
    2> "${TEMP_DIR}/restore.log"

if [ $? -ne 0 ]; then
    error "Database restore failed. Check ${TEMP_DIR}/restore.log"
    cat "${TEMP_DIR}/restore.log" >&2
    exit 1
fi

# Verify restore
log "Verifying restore..."

TABLE_COUNT=$(PGPASSWORD="${DB_PASSWORD}" psql \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')

log "Restored ${TABLE_COUNT} tables"

# Run ANALYZE
log "Running ANALYZE..."
PGPASSWORD="${DB_PASSWORD}" psql \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    -c "ANALYZE;"

log "Database restore completed successfully!"
log "Pre-restore backup saved at: ${TEMP_DIR}/pre_restore_backup.dump"
