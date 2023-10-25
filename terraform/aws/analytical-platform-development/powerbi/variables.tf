variable "account_ids" {
  type        = map(string)
  description = "Map of account names to account IDs"
}

variable "bucket" {
  type        = string
  description = "Name of the S3 bucket used for testing PowerBI"
}

variable "tags" {
  type        = map(string)
  description = "Map of tags to apply to resources"
}
