# Disaster Recovery Playbook

## Overview

This document outlines the disaster recovery (DR) procedures for Max Facility Operations (MFO).

**Recovery Objectives:**
- **RTO (Recovery Time Objective):** 4 hours
- **RPO (Recovery Point Objective):** 1 hour

## Contact Information

| Role | Contact | Phone |
|------|---------|-------|
| On-Call Engineer | PagerDuty | N/A |
| Platform Lead | platform-lead@maxfacilityops.com | TBD |
| Database Admin | dba-team@maxfacilityops.com | TBD |
| Security Lead | security@maxfacilityops.com | TBD |

## Backup Schedule

| Data | Frequency | Retention | Location |
|------|-----------|-----------|----------|
| PostgreSQL Database | Every 1 hour | 30 days | s3://mfo-backups/database/ |
| S3 Uploads | Every 6 hours | 90 days | s3://mfo-backups/uploads/ |
| Redis Cache | N/A | N/A | Reconstructed on restart |
| Configuration | On change | 365 days | Git repository |

## Disaster Scenarios

### Scenario 1: Database Corruption

**Symptoms:**
- Application errors related to database queries
- Data inconsistencies reported by users
- PostgreSQL error logs show corruption

**Recovery Steps:**

1. **Assess the damage:**
   ```bash
   # Check database status
   kubectl exec -it postgres-0 -n mfo-production -- psql -c "SELECT * FROM pg_stat_database;"

   # Check for corruption
   kubectl exec -it postgres-0 -n mfo-production -- psql -c "SELECT datname, pg_database_size(datname) FROM pg_database;"
   ```

2. **Stop application traffic:**
   ```bash
   # Scale down application
   kubectl scale deployment mfo-web --replicas=0 -n mfo-production
   kubectl scale deployment mfo-worker --replicas=0 -n mfo-production
   ```

3. **Identify latest valid backup:**
   ```bash
   aws s3 ls s3://mfo-backups/database/ --recursive | sort -k1,2 | tail -20
   ```

4. **Restore database:**
   ```bash
   # Run restore script
   ./scripts/backup/database-restore.sh mfo_db_backup_YYYYMMDD_HHMMSS.sql.gz
   ```

5. **Verify data integrity:**
   ```bash
   # Check table counts
   kubectl exec -it postgres-0 -- psql -d mfo -c "SELECT schemaname, tablename, n_live_tup FROM pg_stat_user_tables;"
   ```

6. **Restart application:**
   ```bash
   kubectl scale deployment mfo-web --replicas=5 -n mfo-production
   kubectl scale deployment mfo-worker --replicas=3 -n mfo-production
   ```

7. **Monitor for issues:**
   - Check Grafana dashboards
   - Review error logs
   - Verify user-facing functionality

### Scenario 2: Complete Region Failure

**Symptoms:**
- AWS region unavailable
- All services unresponsive
- CloudFront returns 5xx errors

**Recovery Steps:**

1. **Confirm region failure:**
   - Check AWS Service Health Dashboard
   - Verify from multiple network locations

2. **Activate DR region:**
   ```bash
   # Switch to DR region
   export AWS_REGION=us-west-2

   # Deploy infrastructure
   cd terraform/environments/dr
   terraform apply
   ```

3. **Restore database to DR region:**
   ```bash
   # Database backup is cross-region replicated
   aws s3 cp s3://mfo-backups-dr/database/latest.sql.gz /tmp/

   # Restore to DR database
   DB_HOST=dr-postgres.mfo.internal ./scripts/backup/database-restore.sh /tmp/latest.sql.gz
   ```

4. **Update DNS:**
   ```bash
   # Update Route53 failover record
   aws route53 change-resource-record-sets \
     --hosted-zone-id ZONE_ID \
     --change-batch file://dns-failover.json
   ```

5. **Deploy application:**
   ```bash
   kubectl config use-context mfo-dr-cluster
   kubectl apply -k k8s/overlays/production/
   ```

6. **Verify services:**
   - Test all API endpoints
   - Verify integrations (Stripe, email, etc.)
   - Check monitoring is working

7. **Communicate status:**
   - Update status page
   - Notify customers if impact > 15 minutes

### Scenario 3: Security Breach

**Symptoms:**
- Unauthorized access detected
- Data exfiltration suspected
- Abnormal API patterns

**Recovery Steps:**

1. **Isolate affected systems:**
   ```bash
   # Block all external traffic
   kubectl apply -f k8s/emergency/network-lockdown.yaml

   # Revoke all active sessions
   kubectl exec -it redis-0 -- redis-cli FLUSHALL
   ```

2. **Preserve evidence:**
   ```bash
   # Snapshot affected volumes
   aws ec2 create-snapshot --volume-id vol-xxx --description "Incident response"

   # Export logs
   aws logs filter-log-events --log-group-name mfo-production --output json > incident_logs.json
   ```

3. **Assess scope:**
   - Review audit logs
   - Check for unauthorized data access
   - Identify attack vector

4. **Rotate credentials:**
   ```bash
   # Rotate database credentials
   aws secretsmanager rotate-secret --secret-id mfo-prod-rds-credentials

   # Rotate API keys
   ./scripts/security/rotate-api-keys.sh

   # Rotate JWT secrets
   ./scripts/security/rotate-jwt-secret.sh
   ```

5. **Patch vulnerabilities:**
   - Apply security patches
   - Update affected dependencies
   - Harden configurations

6. **Restore from clean backup:**
   ```bash
   # Use backup from before breach
   ./scripts/backup/database-restore.sh mfo_db_backup_pre_breach.sql.gz
   ```

7. **Post-incident:**
   - Document findings
   - Conduct root cause analysis
   - Notify affected parties if required
   - File compliance reports (GDPR, etc.)

### Scenario 4: Application Deployment Failure

**Symptoms:**
- New deployment causes outages
- Error rates spike
- Health checks failing

**Recovery Steps:**

1. **Immediate rollback:**
   ```bash
   # Rollback deployment
   kubectl rollout undo deployment/mfo-web -n mfo-production

   # Or rollback to specific revision
   kubectl rollout undo deployment/mfo-web --to-revision=5 -n mfo-production
   ```

2. **Verify rollback:**
   ```bash
   kubectl rollout status deployment/mfo-web -n mfo-production
   kubectl get pods -n mfo-production
   ```

3. **Investigate failure:**
   ```bash
   # Check failed pod logs
   kubectl logs -l app=mfo-web --previous -n mfo-production

   # Check events
   kubectl get events -n mfo-production --sort-by='.lastTimestamp'
   ```

4. **Fix and redeploy:**
   - Fix identified issues
   - Run full test suite
   - Deploy to staging first
   - Gradual production rollout

## Recovery Verification Checklist

After any disaster recovery, verify:

- [ ] All API endpoints responding correctly
- [ ] Database connections working
- [ ] Redis cache operational
- [ ] User authentication working
- [ ] Booking system functional
- [ ] Payment processing working (test transaction)
- [ ] Email notifications sending
- [ ] File uploads working
- [ ] Background jobs processing
- [ ] Monitoring and alerting operational
- [ ] SSL certificates valid
- [ ] DNS resolving correctly

## DR Testing Schedule

| Test Type | Frequency | Last Test | Next Test |
|-----------|-----------|-----------|-----------|
| Database Restore | Monthly | TBD | TBD |
| Region Failover | Quarterly | TBD | TBD |
| Full DR Drill | Annually | TBD | TBD |

## Runbooks

Additional runbooks for specific components:

- [PostgreSQL Runbook](./runbooks/postgresql.md)
- [Redis Runbook](./runbooks/redis.md)
- [Kubernetes Runbook](./runbooks/kubernetes.md)
- [Networking Runbook](./runbooks/networking.md)

## Appendix

### Useful Commands

```bash
# Check backup status
aws s3 ls s3://mfo-backups/database/ --human-readable | tail -5

# Verify backup integrity
./scripts/backup/database-restore.sh --dry-run

# Check replication lag
kubectl exec -it postgres-0 -- psql -c "SELECT * FROM pg_stat_replication;"

# Force leader election (Redis)
kubectl exec -it redis-0 -- redis-cli CLUSTER FAILOVER

# Check certificate expiry
kubectl get secret mfo-tls -o jsonpath='{.data.tls\.crt}' | base64 -d | openssl x509 -noout -enddate
```

### Emergency Contacts

- AWS Support: https://console.aws.amazon.com/support
- Stripe Support: https://support.stripe.com
- CloudFlare (if used): https://support.cloudflare.com
