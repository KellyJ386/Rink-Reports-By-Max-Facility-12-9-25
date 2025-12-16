# Backup & Disaster Recovery

This directory contains backup scripts and disaster recovery procedures for Max Facility Operations (MFO).

## Overview

| Component | Backup Frequency | Retention | Storage |
|-----------|-----------------|-----------|---------|
| PostgreSQL Database | Hourly | 30 days | S3 (STANDARD_IA) |
| S3 Uploads | Every 6 hours | 90 days | S3 (Cross-region) |
| Configuration | On change | Indefinite | Git |

## Scripts

### database-backup.sh

Creates a compressed backup of the PostgreSQL database and uploads to S3.

```bash
# Environment variables
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=mfo
export DB_USER=mfo
export DB_PASSWORD=xxx
export BACKUP_BUCKET=mfo-backups

# Run backup
./database-backup.sh
```

Features:
- Compressed with gzip
- SHA256 checksum verification
- Automatic cleanup of old backups
- Creates a `latest.sql.gz` pointer

### database-restore.sh

Restores the PostgreSQL database from an S3 backup.

```bash
# Restore latest backup
./database-restore.sh

# Restore specific backup
./database-restore.sh mfo_db_backup_20241210_120000.sql.gz

# Dry run (verify without restoring)
DRY_RUN=true ./database-restore.sh
```

Features:
- Checksum verification
- Pre-restore backup creation
- Dry run mode for testing
- Table structure validation

### s3-backup.sh

Syncs the uploads bucket to the backup bucket.

```bash
export SOURCE_BUCKET=mfo-uploads
export BACKUP_BUCKET=mfo-backups

./s3-backup.sh
```

## Kubernetes CronJobs

Backups are automated using Kubernetes CronJobs:

```bash
# Apply backup CronJobs
kubectl apply -f k8s/base/backup-cronjobs.yaml

# Check backup job status
kubectl get cronjobs -n mfo

# View recent backup jobs
kubectl get jobs -n mfo -l component=backup

# Check backup logs
kubectl logs -l job=database-backup -n mfo --tail=100
```

## Manual Backup

### Database

```bash
# Create manual backup
kubectl create job --from=cronjob/database-backup manual-backup-$(date +%s) -n mfo

# Monitor progress
kubectl logs -f job/manual-backup-xxx -n mfo
```

### Full System Backup

```bash
# 1. Database backup
./database-backup.sh

# 2. S3 uploads backup
./s3-backup.sh

# 3. Export Kubernetes resources
kubectl get all -n mfo -o yaml > k8s-resources-backup.yaml

# 4. Export secrets (encrypted)
kubectl get secrets -n mfo -o yaml | gpg -e -r backup@maxfacilityops.com > secrets-backup.yaml.gpg
```

## Restore Procedures

### Database Restore

See [Disaster Recovery Playbook](./disaster-recovery.md#scenario-1-database-corruption)

Quick steps:
1. Scale down application
2. Download backup from S3
3. Verify checksum
4. Restore database
5. Verify data
6. Scale up application

### Point-in-Time Recovery

If using RDS with point-in-time recovery enabled:

```bash
aws rds restore-db-instance-to-point-in-time \
    --source-db-instance-identifier mfo-production \
    --target-db-instance-identifier mfo-recovery \
    --restore-time 2024-12-10T12:00:00Z
```

## Monitoring

### Backup Alerts

The following alerts monitor backup health:

| Alert | Condition | Severity |
|-------|-----------|----------|
| BackupJobFailed | CronJob failed | Critical |
| BackupTooOld | Latest backup > 2 hours | Warning |
| BackupSizeDrop | Backup size < 50% of average | Warning |

### Metrics

Backup metrics exposed to Prometheus:

- `backup_last_success_timestamp` - Timestamp of last successful backup
- `backup_size_bytes` - Size of last backup
- `backup_duration_seconds` - Duration of backup operation

## Testing

### Monthly Restore Test

```bash
# 1. Create test database
kubectl exec -it postgres-0 -- psql -c "CREATE DATABASE mfo_restore_test;"

# 2. Restore to test database
DB_NAME=mfo_restore_test ./database-restore.sh latest.sql.gz

# 3. Verify data
kubectl exec -it postgres-0 -- psql -d mfo_restore_test -c "SELECT COUNT(*) FROM users;"

# 4. Cleanup
kubectl exec -it postgres-0 -- psql -c "DROP DATABASE mfo_restore_test;"
```

### Verify Backup Integrity

```bash
# Run verification (dry run restore)
kubectl create job --from=cronjob/backup-verification manual-verify-$(date +%s) -n mfo
```

## Security

- All backups are encrypted at rest (S3 SSE-S3)
- Cross-region replication enabled for disaster recovery
- IAM roles follow principle of least privilege
- Backup scripts run in isolated containers
- Secrets never logged or stored in backups

## Troubleshooting

### Backup Job Stuck

```bash
# Check job status
kubectl describe job database-backup-xxx -n mfo

# Check pod status
kubectl describe pod database-backup-xxx -n mfo

# Common issues:
# - IAM permissions (check IRSA)
# - Database connectivity
# - S3 bucket permissions
```

### Restore Fails

```bash
# Check restore logs
kubectl logs database-restore-xxx -n mfo

# Common issues:
# - Checksum mismatch (corrupted download)
# - Insufficient disk space
# - Database connection issues
# - Foreign key constraint violations
```

### Missing Backups

```bash
# List all backups
aws s3 ls s3://mfo-backups/database/ --recursive

# Check lifecycle rules (may have expired)
aws s3api get-bucket-lifecycle-configuration --bucket mfo-backups
```
