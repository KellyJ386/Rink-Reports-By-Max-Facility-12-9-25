# Terraform Infrastructure

This directory contains Terraform configurations for deploying Max Facility Operations (MFO) infrastructure on AWS.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            CloudFront CDN                                │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼─────────────────────────────────────┐
│                              AWS WAF                                      │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼─────────────────────────────────────┐
│                       Application Load Balancer                          │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼─────────────────────────────────────┐
│                           EKS Cluster                                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │   Node Group    │  │   Node Group    │  │   Node Group    │         │
│  │     (AZ-a)      │  │     (AZ-b)      │  │     (AZ-c)      │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│     RDS       │           │  ElastiCache  │           │      S3       │
│  PostgreSQL   │           │    Redis      │           │   Buckets     │
│   (Multi-AZ)  │           │   (Cluster)   │           │               │
└───────────────┘           └───────────────┘           └───────────────┘
```

## Directory Structure

```
terraform/
├── modules/
│   ├── vpc/           # VPC, subnets, NAT, flow logs
│   ├── eks/           # EKS cluster and node groups
│   ├── rds/           # PostgreSQL database
│   ├── elasticache/   # Redis cluster
│   ├── s3/            # S3 buckets for uploads, backups, logs
│   └── cloudfront/    # CDN distribution
├── environments/
│   ├── dev/           # Development environment
│   ├── staging/       # Staging environment
│   └── prod/          # Production environment
└── README.md
```

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured
- S3 bucket for state storage
- DynamoDB table for state locking

### Initial Setup

```bash
# Create S3 bucket for state
aws s3 mb s3://mfo-terraform-state --region us-east-1

# Create DynamoDB table for locking
aws dynamodb create-table \
  --table-name mfo-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

## Usage

### Development

```bash
cd terraform/environments/dev
terraform init
terraform plan
terraform apply
```

### Staging

```bash
cd terraform/environments/staging
terraform init
terraform plan
terraform apply
```

### Production

```bash
cd terraform/environments/prod
terraform init
terraform plan -out=tfplan
# Review the plan carefully
terraform apply tfplan
```

## Modules

### VPC Module

Creates:
- VPC with DNS support
- Public, private, and database subnets across 3 AZs
- Internet Gateway
- NAT Gateways (configurable: single or HA)
- Route tables
- VPC Flow Logs

### EKS Module

Creates:
- EKS cluster with encryption
- Managed node group
- OIDC provider for IRSA
- CloudWatch log group
- IAM roles and policies

### RDS Module

Creates:
- PostgreSQL instance (15.x)
- Multi-AZ deployment (production)
- Read replica (production)
- Parameter group
- Subnet group
- Secrets Manager secret
- Performance Insights enabled

### ElastiCache Module

Creates:
- Redis replication group
- Encryption at rest and in transit
- Auth token stored in Secrets Manager
- Automatic failover (production)

### S3 Module

Creates:
- Uploads bucket (versioned, encrypted)
- Backups bucket (lifecycle policies)
- Logs bucket (retention policies)
- IAM policy for access

### CloudFront Module

Creates:
- CloudFront distribution
- Origin Access Identity
- Cache behaviors for static/dynamic content
- Custom error responses
- TLS configuration

## Environment Configuration

| Setting | Dev | Staging | Production |
|---------|-----|---------|------------|
| EKS Node Type | t3.medium | t3.large | t3.large/xlarge |
| EKS Nodes | 2 | 3 | 5-20 |
| RDS Instance | db.t3.medium | db.t3.large | db.r6g.large |
| RDS Multi-AZ | No | Yes | Yes |
| Redis Type | cache.t3.micro | cache.t3.medium | cache.r6g.large |
| Redis Nodes | 1 | 2 | 3 |
| NAT Gateway | Single | Single | Multi-AZ |

## Security

- All data encrypted at rest
- TLS 1.2+ for data in transit
- VPC Flow Logs enabled
- Secrets stored in AWS Secrets Manager
- IAM roles follow least privilege
- Security groups restrict access

## Costs (Estimated Monthly)

| Resource | Dev | Staging | Production |
|----------|-----|---------|------------|
| EKS Cluster | $73 | $73 | $73 |
| EC2 Nodes | $120 | $250 | $600+ |
| RDS | $50 | $150 | $500+ |
| ElastiCache | $15 | $75 | $300+ |
| NAT Gateway | $35 | $35 | $105 |
| S3 + Transfer | $10 | $30 | $100+ |
| CloudFront | - | $50 | $200+ |
| **Total** | ~$300 | ~$650 | ~$1900+ |

## Troubleshooting

### State Lock Issues
```bash
terraform force-unlock <LOCK_ID>
```

### EKS Access
```bash
aws eks update-kubeconfig --region us-east-1 --name mfo-prod-cluster
kubectl get nodes
```

### RDS Connection
```bash
# Get credentials from Secrets Manager
aws secretsmanager get-secret-value --secret-id mfo-prod-rds-credentials
```

## Destroy

⚠️ **Warning**: This will destroy all resources

```bash
terraform destroy
```

For production, ensure:
1. Database backups are taken
2. S3 buckets are emptied
3. Team is notified
