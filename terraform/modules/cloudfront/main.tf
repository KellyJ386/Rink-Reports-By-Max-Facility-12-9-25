# CloudFront CDN Module for MFO Infrastructure

variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "domain_name" {
  type        = string
  description = "Primary domain name"
}

variable "origin_domain" {
  type        = string
  description = "Origin domain (ALB or API Gateway)"
}

variable "acm_certificate_arn" {
  type        = string
  description = "ACM certificate ARN for HTTPS"
}

variable "s3_uploads_bucket_domain" {
  type        = string
  description = "S3 uploads bucket domain for static assets"
  default     = ""
}

variable "waf_web_acl_arn" {
  type        = string
  description = "WAF Web ACL ARN"
  default     = ""
}

locals {
  name = "${var.project_name}-${var.environment}"

  tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Origin Access Identity for S3
resource "aws_cloudfront_origin_access_identity" "main" {
  comment = "${local.name} CloudFront OAI"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${local.name} distribution"
  default_root_object = ""
  price_class         = "PriceClass_100"
  http_version        = "http2and3"

  aliases = [var.domain_name]

  # Primary origin (Application)
  origin {
    domain_name = var.origin_domain
    origin_id   = "app"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }

    custom_header {
      name  = "X-Custom-Header"
      value = "CloudFront"
    }
  }

  # S3 origin for uploads (if provided)
  dynamic "origin" {
    for_each = var.s3_uploads_bucket_domain != "" ? [1] : []
    content {
      domain_name = var.s3_uploads_bucket_domain
      origin_id   = "s3-uploads"

      s3_origin_config {
        origin_access_identity = aws_cloudfront_origin_access_identity.main.cloudfront_access_identity_path
      }
    }
  }

  # Default behavior (application)
  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "app"

    forwarded_values {
      query_string = true
      headers      = ["Host", "Origin", "Authorization", "Accept-Language"]

      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 86400

    # Lambda@Edge functions can be added here
  }

  # Static assets behavior
  ordered_cache_behavior {
    path_pattern     = "/_next/static/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "app"

    forwarded_values {
      query_string = false
      headers      = []

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    min_ttl     = 86400
    default_ttl = 604800
    max_ttl     = 31536000
  }

  # Uploads behavior (if S3 origin exists)
  dynamic "ordered_cache_behavior" {
    for_each = var.s3_uploads_bucket_domain != "" ? [1] : []
    content {
      path_pattern     = "/uploads/*"
      allowed_methods  = ["GET", "HEAD", "OPTIONS"]
      cached_methods   = ["GET", "HEAD", "OPTIONS"]
      target_origin_id = "s3-uploads"

      forwarded_values {
        query_string = false
        headers      = ["Origin", "Access-Control-Request-Headers", "Access-Control-Request-Method"]

        cookies {
          forward = "none"
        }
      }

      viewer_protocol_policy = "redirect-to-https"
      compress               = true

      min_ttl     = 86400
      default_ttl = 604800
      max_ttl     = 31536000
    }
  }

  # API behavior (no caching)
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "app"

    forwarded_values {
      query_string = true
      headers      = ["*"]

      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  # Custom error responses
  custom_error_response {
    error_caching_min_ttl = 10
    error_code            = 500
    response_code         = 500
    response_page_path    = "/500.html"
  }

  custom_error_response {
    error_caching_min_ttl = 10
    error_code            = 502
    response_code         = 502
    response_page_path    = "/500.html"
  }

  custom_error_response {
    error_caching_min_ttl = 10
    error_code            = 503
    response_code         = 503
    response_page_path    = "/500.html"
  }

  # Geo restrictions (optional)
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # TLS certificate
  viewer_certificate {
    acm_certificate_arn      = var.acm_certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  # WAF (if provided)
  web_acl_id = var.waf_web_acl_arn != "" ? var.waf_web_acl_arn : null

  # Logging
  logging_config {
    include_cookies = false
    bucket          = "${local.name}-logs.s3.amazonaws.com"
    prefix          = "cloudfront/"
  }

  tags = local.tags
}

# Outputs
output "distribution_id" {
  value = aws_cloudfront_distribution.main.id
}

output "distribution_arn" {
  value = aws_cloudfront_distribution.main.arn
}

output "distribution_domain_name" {
  value = aws_cloudfront_distribution.main.domain_name
}

output "hosted_zone_id" {
  value = aws_cloudfront_distribution.main.hosted_zone_id
}

output "oai_iam_arn" {
  value = aws_cloudfront_origin_access_identity.main.iam_arn
}
