terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "4.61.0"
    }
    pagerduty = {
      source  = "pagerduty/pagerduty"
      version = "2.12.1"
    }
  }
}
