# S3 Module for MFO Infrastructure

variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "create_uploads_bucket" {
  type    = bool
  default = true
}

variable "create_backups_bucket" {
  type    = bool
  default = true
}

variable "create_logs_bucket" {
  type    = bool
  default = true
}

locals {
  name = "${var.project_name}-${var.environment}"

  tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Uploads Bucket
resource "aws_s3_bucket" "uploads" {
  count  = var.create_uploads_bucket ? 1 : 0
  bucket = "${local.name}-uploads"

  tags = merge(local.tags, {
    Name = "${local.name}-uploads"
  })
}

resource "aws_s3_bucket_versioning" "uploads" {
  count  = var.create_uploads_bucket ? 1 : 0
  bucket = aws_s3_bucket.uploads[0].id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "uploads" {
  count  = var.create_uploads_bucket ? 1 : 0
  bucket = aws_s3_bucket.uploads[0].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "uploads" {
  count  = var.create_uploads_bucket ? 1 : 0
  bucket = aws_s3_bucket.uploads[0].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_cors_configuration" "uploads" {
  count  = var.create_uploads_bucket ? 1 : 0
  bucket = aws_s3_bucket.uploads[0].id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = ["https://*.maxfacility.com"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "uploads" {
  count  = var.create_uploads_bucket ? 1 : 0
  bucket = aws_s3_bucket.uploads[0].id

  rule {
    id     = "archive-old-versions"
    status = "Enabled"

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "STANDARD_IA"
    }

    noncurrent_version_transition {
      noncurrent_days = 90
      storage_class   = "GLACIER"
    }

    noncurrent_version_expiration {
      noncurrent_days = 365
    }
  }

  rule {
    id     = "expire-temp-uploads"
    status = "Enabled"

    filter {
      prefix = "temp/"
    }

    expiration {
      days = 7
    }
  }
}

# Backups Bucket
resource "aws_s3_bucket" "backups" {
  count  = var.create_backups_bucket ? 1 : 0
  bucket = "${local.name}-backups"

  tags = merge(local.tags, {
    Name = "${local.name}-backups"
  })
}

resource "aws_s3_bucket_versioning" "backups" {
  count  = var.create_backups_bucket ? 1 : 0
  bucket = aws_s3_bucket.backups[0].id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backups" {
  count  = var.create_backups_bucket ? 1 : 0
  bucket = aws_s3_bucket.backups[0].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "backups" {
  count  = var.create_backups_bucket ? 1 : 0
  bucket = aws_s3_bucket.backups[0].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "backups" {
  count  = var.create_backups_bucket ? 1 : 0
  bucket = aws_s3_bucket.backups[0].id

  rule {
    id     = "transition-to-glacier"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }
  }
}

# Logs Bucket
resource "aws_s3_bucket" "logs" {
  count  = var.create_logs_bucket ? 1 : 0
  bucket = "${local.name}-logs"

  tags = merge(local.tags, {
    Name = "${local.name}-logs"
  })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  count  = var.create_logs_bucket ? 1 : 0
  bucket = aws_s3_bucket.logs[0].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "logs" {
  count  = var.create_logs_bucket ? 1 : 0
  bucket = aws_s3_bucket.logs[0].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  count  = var.create_logs_bucket ? 1 : 0
  bucket = aws_s3_bucket.logs[0].id

  rule {
    id     = "expire-old-logs"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    expiration {
      days = 90
    }
  }
}

# IAM Policy for S3 access
resource "aws_iam_policy" "s3_access" {
  name        = "${local.name}-s3-access"
  description = "Policy for S3 bucket access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "UploadsBucketAccess"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = var.create_uploads_bucket ? [
          aws_s3_bucket.uploads[0].arn,
          "${aws_s3_bucket.uploads[0].arn}/*"
        ] : []
      },
      {
        Sid    = "BackupsBucketAccess"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = var.create_backups_bucket ? [
          aws_s3_bucket.backups[0].arn,
          "${aws_s3_bucket.backups[0].arn}/*"
        ] : []
      }
    ]
  })

  tags = local.tags
}

# Outputs
output "uploads_bucket_name" {
  value = var.create_uploads_bucket ? aws_s3_bucket.uploads[0].id : null
}

output "uploads_bucket_arn" {
  value = var.create_uploads_bucket ? aws_s3_bucket.uploads[0].arn : null
}

output "backups_bucket_name" {
  value = var.create_backups_bucket ? aws_s3_bucket.backups[0].id : null
}

output "backups_bucket_arn" {
  value = var.create_backups_bucket ? aws_s3_bucket.backups[0].arn : null
}

output "logs_bucket_name" {
  value = var.create_logs_bucket ? aws_s3_bucket.logs[0].id : null
}

output "s3_access_policy_arn" {
  value = aws_iam_policy.s3_access.arn
}
