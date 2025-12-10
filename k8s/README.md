# Kubernetes Deployment

This directory contains Kubernetes manifests for deploying Max Facility Operations (MFO).

## Structure

```
k8s/
├── base/                    # Base configuration (shared across environments)
│   ├── namespace.yaml       # Namespace definition
│   ├── configmap.yaml       # Application configuration
│   ├── secret.yaml          # Secrets (use external secrets in production)
│   ├── rbac.yaml            # ServiceAccount and RBAC
│   ├── deployment.yaml      # Web and Worker deployments
│   ├── service.yaml         # Service definitions
│   ├── ingress.yaml         # Ingress configuration
│   ├── hpa.yaml             # Horizontal Pod Autoscaler
│   ├── pdb.yaml             # Pod Disruption Budget
│   ├── network-policy.yaml  # Network policies
│   └── kustomization.yaml   # Kustomize base
├── overlays/
│   ├── development/         # Dev environment overrides
│   ├── staging/             # Staging environment overrides
│   └── production/          # Production environment overrides
└── README.md
```

## Prerequisites

- Kubernetes cluster (1.25+)
- kubectl configured
- kustomize (or kubectl with kustomize support)
- Ingress controller (NGINX or ALB)
- cert-manager (for TLS)

## Deployment

### Development
```bash
kubectl apply -k k8s/overlays/development
```

### Staging
```bash
kubectl apply -k k8s/overlays/staging
```

### Production
```bash
kubectl apply -k k8s/overlays/production
```

## Verify Deployment

```bash
# Check pods
kubectl get pods -n mfo-production

# Check services
kubectl get svc -n mfo-production

# Check ingress
kubectl get ingress -n mfo-production

# View logs
kubectl logs -f deployment/prod-mfo-web -n mfo-production

# Check HPA status
kubectl get hpa -n mfo-production
```

## Configuration

### Secrets Management

For production, use one of:
- **External Secrets Operator** with AWS Secrets Manager
- **HashiCorp Vault** with Vault Agent Injector
- **Sealed Secrets** for GitOps
- **SOPS** for encrypted secrets in Git

### Scaling

The HPA is configured to scale based on:
- CPU utilization (target: 70%)
- Memory utilization (target: 80%)

Production settings:
- Min replicas: 5
- Max replicas: 50

### Resource Limits

| Environment | CPU Request | CPU Limit | Memory Request | Memory Limit |
|-------------|-------------|-----------|----------------|--------------|
| Development | 50m         | 500m      | 128Mi          | 512Mi        |
| Staging     | 100m        | 1000m     | 256Mi          | 1Gi          |
| Production  | 200m        | 2000m     | 512Mi          | 2Gi          |

## Monitoring

Pods are annotated for Prometheus scraping:
```yaml
annotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "3000"
  prometheus.io/path: "/api/metrics"
```

## Security

- Non-root containers
- Read-only root filesystem
- Network policies enabled
- Pod Security Standards enforced
- RBAC with least privilege

## Troubleshooting

### Pod not starting
```bash
kubectl describe pod <pod-name> -n mfo-production
kubectl logs <pod-name> -n mfo-production --previous
```

### Network issues
```bash
kubectl exec -it <pod-name> -n mfo-production -- wget -qO- http://mfo-web/api/health
```

### Resource issues
```bash
kubectl top pods -n mfo-production
kubectl describe node
```
