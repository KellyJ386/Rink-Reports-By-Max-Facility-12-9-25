# Production Environment - Main Configuration

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  backend "s3" {
    bucket         = "mfo-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "mfo-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# Provider for ACM certificates (must be us-east-1 for CloudFront)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

# Variables
variable "project_name" {
  type    = string
  default = "mfo"
}

variable "environment" {
  type    = string
  default = "prod"
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "domain_name" {
  type    = string
  default = "maxfacility.com"
}

locals {
  name               = "${var.project_name}-${var.environment}"
  availability_zones = ["${var.aws_region}a", "${var.aws_region}b", "${var.aws_region}c"]
}

# VPC Module
module "vpc" {
  source = "../../modules/vpc"

  project_name       = var.project_name
  environment        = var.environment
  vpc_cidr           = "10.0.0.0/16"
  availability_zones = local.availability_zones
  enable_nat_gateway = true
  single_nat_gateway = false # High availability in production
}

# EKS Module
module "eks" {
  source = "../../modules/eks"

  project_name        = var.project_name
  environment         = var.environment
  vpc_id              = module.vpc.vpc_id
  private_subnet_ids  = module.vpc.private_subnet_ids
  cluster_version     = "1.28"
  node_instance_types = ["t3.large", "t3.xlarge"]
  node_desired_size   = 5
  node_min_size       = 3
  node_max_size       = 20
}

# RDS Module
module "rds" {
  source = "../../modules/rds"

  project_name            = var.project_name
  environment             = var.environment
  vpc_id                  = module.vpc.vpc_id
  database_subnet_ids     = module.vpc.database_subnet_ids
  allowed_security_groups = [] # Add EKS node security group
  instance_class          = "db.r6g.large"
  allocated_storage       = 100
  max_allocated_storage   = 500
  multi_az                = true
  backup_retention_period = 30
  deletion_protection     = true
}

# ElastiCache Module
module "elasticache" {
  source = "../../modules/elasticache"

  project_name               = var.project_name
  environment                = var.environment
  vpc_id                     = module.vpc.vpc_id
  private_subnet_ids         = module.vpc.private_subnet_ids
  allowed_security_groups    = [] # Add EKS node security group
  node_type                  = "cache.r6g.large"
  num_cache_nodes            = 3
  automatic_failover_enabled = true
}

# S3 Module
module "s3" {
  source = "../../modules/s3"

  project_name          = var.project_name
  environment           = var.environment
  create_uploads_bucket = true
  create_backups_bucket = true
  create_logs_bucket    = true
}

# ACM Certificate for CloudFront
resource "aws_acm_certificate" "main" {
  provider          = aws.us_east_1
  domain_name       = "app.${var.domain_name}"
  validation_method = "DNS"

  subject_alternative_names = [
    "*.${var.domain_name}",
    var.domain_name
  ]

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "${local.name}-cert"
  }
}

# CloudFront Module (commented out until domain is configured)
# module "cloudfront" {
#   source = "../../modules/cloudfront"
#
#   project_name        = var.project_name
#   environment         = var.environment
#   domain_name         = "app.${var.domain_name}"
#   origin_domain       = "alb.${var.domain_name}" # Replace with ALB domain
#   acm_certificate_arn = aws_acm_certificate.main.arn
# }

# Outputs
output "vpc_id" {
  value = module.vpc.vpc_id
}

output "eks_cluster_name" {
  value = module.eks.cluster_name
}

output "eks_cluster_endpoint" {
  value = module.eks.cluster_endpoint
}

output "rds_endpoint" {
  value     = module.rds.endpoint
  sensitive = true
}

output "redis_endpoint" {
  value     = module.elasticache.primary_endpoint
  sensitive = true
}

output "s3_uploads_bucket" {
  value = module.s3.uploads_bucket_name
}

output "rds_secret_arn" {
  value = module.rds.secret_arn
}

output "redis_secret_arn" {
  value = module.elasticache.secret_arn
}

# Kubeconfig command
output "configure_kubectl" {
  value = "aws eks update-kubeconfig --region ${var.aws_region} --name ${module.eks.cluster_name}"
}
