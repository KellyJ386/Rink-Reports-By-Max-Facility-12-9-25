#!/bin/bash

# S3 Backup Script for MFO
# Syncs uploads bucket to backup bucket with versioning

set -euo pipefail

# Configuration
SOURCE_BUCKET="${SOURCE_BUCKET:-mfo-uploads}"
BACKUP_BUCKET="${BACKUP_BUCKET:-mfo-backups}"
BACKUP_PREFIX="${BACKUP_PREFIX:-uploads}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >&2
}

log "Starting S3 backup..."
log "Source: s3://${SOURCE_BUCKET}"
log "Destination: s3://${BACKUP_BUCKET}/${BACKUP_PREFIX}"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    error "AWS CLI is required but not installed"
    exit 1
fi

# Sync uploads
log "Syncing uploads..."

aws s3 sync \
    "s3://${SOURCE_BUCKET}/" \
    "s3://${BACKUP_BUCKET}/${BACKUP_PREFIX}/" \
    --storage-class STANDARD_IA \
    --metadata "backup_timestamp=${TIMESTAMP}" \
    --only-show-errors

if [ $? -ne 0 ]; then
    error "S3 sync failed"
    exit 1
fi

# Get sync statistics
SOURCE_COUNT=$(aws s3 ls "s3://${SOURCE_BUCKET}/" --recursive --summarize | grep "Total Objects:" | awk '{print $3}')
SOURCE_SIZE=$(aws s3 ls "s3://${SOURCE_BUCKET}/" --recursive --summarize | grep "Total Size:" | awk '{print $3, $4}')

log "Synced ${SOURCE_COUNT} objects (${SOURCE_SIZE})"

# Create manifest
log "Creating backup manifest..."

MANIFEST_FILE="/tmp/backup_manifest_${TIMESTAMP}.json"
cat > "${MANIFEST_FILE}" << EOF
{
    "timestamp": "${TIMESTAMP}",
    "source_bucket": "${SOURCE_BUCKET}",
    "backup_bucket": "${BACKUP_BUCKET}",
    "backup_prefix": "${BACKUP_PREFIX}",
    "object_count": "${SOURCE_COUNT}",
    "total_size": "${SOURCE_SIZE}",
    "status": "completed"
}
EOF

aws s3 cp "${MANIFEST_FILE}" \
    "s3://${BACKUP_BUCKET}/${BACKUP_PREFIX}/manifests/manifest_${TIMESTAMP}.json"

rm -f "${MANIFEST_FILE}"

log "S3 backup completed successfully!"
