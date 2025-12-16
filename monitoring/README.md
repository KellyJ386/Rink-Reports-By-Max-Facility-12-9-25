# Monitoring & Observability

This directory contains the monitoring stack configuration for Max Facility Operations (MFO).

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           MFO Application                                │
│                    (Exposes /metrics endpoint)                          │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │       Prometheus        │
                    │  (Scrapes & stores      │
                    │   metrics data)         │
                    └────────────┬────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Grafana      │    │  Alertmanager   │    │      Loki       │
│  (Dashboards)   │    │   (Alerting)    │    │    (Logs)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
         ┌──────────┐    ┌──────────┐    ┌──────────┐
         │  Slack   │    │ PagerDuty│    │  Email   │
         └──────────┘    └──────────┘    └──────────┘
```

## Components

### Prometheus

Prometheus scrapes and stores metrics from:
- MFO application pods (`/metrics` endpoint)
- PostgreSQL (via postgres_exporter)
- Redis (via redis_exporter)
- Kubernetes components (API server, nodes, cAdvisor)
- NGINX Ingress controller

Configuration: `prometheus/prometheus.yaml`

### Alert Rules

Alert rules are defined in `prometheus/alert-rules.yaml`:

| Category | Alerts |
|----------|--------|
| Application | High error rate, high latency, pod not ready, crash looping, high memory/CPU |
| Database | PostgreSQL down, high connections, slow queries, replication lag |
| Cache | Redis down, high memory, high connections, cache miss rate |
| Infrastructure | Node high CPU/memory/disk, node not ready, OOM killed |
| SLA | Availability breach (<99.9%), latency breach (>500ms p95) |

### Alertmanager

Routes alerts to appropriate teams based on severity and labels:

- **Critical alerts**: PagerDuty immediately
- **Database alerts**: DBA team
- **Infrastructure alerts**: Infrastructure team
- **SLA alerts**: Leadership + Platform team
- **Warnings**: Slack (business hours only)

Configuration: `alertmanager/alertmanager.yaml`

### Grafana Dashboards

| Dashboard | Description |
|-----------|-------------|
| MFO Overview | Service health, request traffic, latency, resources |
| MFO Business | Facilities, bookings, revenue, ice quality, maintenance |

Dashboards: `grafana/dashboards/`

## Quick Start

### Docker Compose (Local Development)

```bash
cd monitoring
docker-compose up -d
```

Access:
- Grafana: http://localhost:3000 (admin/admin)
- Prometheus: http://localhost:9090
- Alertmanager: http://localhost:9093

### Kubernetes Deployment

```bash
# Using Helm
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts

# Install Prometheus
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  -f prometheus/values.yaml

# Apply custom alert rules
kubectl apply -f prometheus/alert-rules.yaml -n monitoring

# Apply Alertmanager config
kubectl create secret generic alertmanager-config \
  --from-file=alertmanager.yaml=alertmanager/alertmanager.yaml \
  -n monitoring
```

## Application Metrics

The MFO application exposes metrics at `/api/metrics`:

### HTTP Metrics
- `http_requests_total{method, status, handler}` - Total HTTP requests
- `http_request_duration_seconds{method, handler}` - Request duration histogram

### Business Metrics
- `mfo_active_facilities_total` - Number of active facilities
- `mfo_active_users_total` - Number of active users
- `mfo_bookings_created_total{type}` - Bookings created by type
- `mfo_revenue_total` - Total revenue processed
- `mfo_ice_quality_score{facility}` - Ice quality score by facility
- `mfo_ice_temperature_celsius{facility}` - Ice temperature
- `mfo_maintenance_tasks_pending` - Pending maintenance tasks
- `mfo_equipment_by_status{status}` - Equipment count by status

### Cache Metrics
- `cache_hits_total` - Cache hits
- `cache_misses_total` - Cache misses

## Setting Up Alerts

### Slack Integration

1. Create a Slack app with Incoming Webhooks
2. Add the webhook URL to Alertmanager config
3. Configure channels for different severity levels

### PagerDuty Integration

1. Create PagerDuty services for each team
2. Generate integration keys
3. Add keys to Alertmanager config

### Email Integration

1. Configure SMTP settings in Alertmanager
2. Add team email addresses to receivers

## SLA Monitoring

MFO has the following SLA targets:

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Availability | 99.9% | < 99.9% |
| P95 Latency | 500ms | > 500ms |
| P99 Latency | 2s | > 2s (warning), > 5s (critical) |

SLA dashboards show rolling 30-day metrics.

## Runbooks

Each alert should have a corresponding runbook:

- `wiki.maxfacilityops.com/runbooks/mfohigherrorrate`
- `wiki.maxfacilityops.com/runbooks/postgresdown`
- `wiki.maxfacilityops.com/runbooks/redisdown`
- etc.

## Customization

### Adding New Alerts

1. Add alert definition to `prometheus/alert-rules.yaml`
2. Add routing in `alertmanager/alertmanager.yaml`
3. Create runbook documentation

### Adding New Dashboards

1. Create JSON file in `grafana/dashboards/`
2. Add `mfo` tag for automatic provisioning
3. Test in Grafana UI before committing

## Troubleshooting

### Prometheus Not Scraping

```bash
# Check targets
curl http://prometheus:9090/api/v1/targets

# Check service discovery
kubectl get endpoints -n mfo-production
```

### Alerts Not Firing

```bash
# Check alert rules
curl http://prometheus:9090/api/v1/rules

# Check Alertmanager
curl http://alertmanager:9093/api/v2/alerts
```

### Grafana Dashboard Not Loading

```bash
# Check datasource
curl -u admin:admin http://grafana:3000/api/datasources

# Check dashboard provisioning
kubectl logs -n monitoring deployment/grafana
```
