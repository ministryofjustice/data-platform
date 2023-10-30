terraform {
  required_version = "~> 1.0"
  required_providers {
    aws = {
      version = "5.23.1"
      source  = "hashicorp/aws"
    }
    github = {
      version = "5.39.0"
      source  = "integrations/github"
    }
    time = {
      version = "0.9.1"
      source  = "hashicorp/time"
    }
    http = {
      version = "3.4.0"
      source  = "hashicorp/http"
    }
    null = {
      version = "3.2.1"
      source  = "hashicorp/null"
    }
  }
}
