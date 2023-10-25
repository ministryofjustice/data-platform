module "powerbi_bucket" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "3.15.1"

  bucket = var.bucket
  acl    = "private"

  control_object_ownership = true
  object_ownership         = "ObjectWriter"

  tags = var.tags
}
