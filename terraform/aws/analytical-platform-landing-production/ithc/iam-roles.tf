resource "aws_iam_policy" "quicksight_user" {
  provider    = aws.analytical-platform-data-production
  name        = "QuickSightPenTesterPolicy"
  path        = "/"
  description = "Create Admin QS User"
  policy      = data.aws_iam_policy_document.quicksight_user.json
}
module "analytical_platform_development_pen_tester" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-assumable-role"
  version = "5.35.0"
  providers = {
    aws = aws.analytical-platform-deveopment
  }
  allow_self_assume_role = true
  attach_admin_policy    = true
  trusted_role_arns      = formatlist("arn:aws:iam::${var.account_ids["analytical-platform-landing-production"]}:user/%s", values(nonsensitive(local.ithc_testers)))

  create_role = true

  role_name             = "PenTester"
  role_requires_mfa     = true
  force_detach_policies = true
}

module "analytical_platform_production_pen_tester" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-assumable-role"
  version = "5.35.0"
  providers = {
    aws = aws.analytical-platform-production
  }
  allow_self_assume_role = true
  attach_readonly_policy = true
  trusted_role_arns      = formatlist("arn:aws:iam::${var.account_ids["analytical-platform-landing-production"]}:user/%s", values(nonsensitive(local.ithc_testers)))

  create_role = true

  role_name             = "PenTester"
  role_requires_mfa     = true
  force_detach_policies = true
  custom_role_policy_arns = [
    "arn:aws:iam::aws:policy/SecurityAudit"
  ]
}

module "analytical_platform_data_production_pen_tester" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-assumable-role"
  version = "5.35.0"
  providers = {
    aws = aws.analytical-platform-data-production
  }
  allow_self_assume_role = true
  attach_readonly_policy = true
  trusted_role_arns      = formatlist("arn:aws:iam::${var.account_ids["analytical-platform-landing-production"]}:user/%s", values(nonsensitive(local.ithc_testers)))

  create_role = true

  role_name             = "PenTester"
  role_requires_mfa     = true
  force_detach_policies = true
  custom_role_policy_arns = [
    "arn:aws:iam::aws:policy/SecurityAudit",
    aws_iam_policy.quicksight_user.arn
  ]
}
