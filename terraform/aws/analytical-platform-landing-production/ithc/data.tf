##################################################
# AWS
##################################################
data "aws_secretsmanager_secret" "ithc_testers" {
  arn = module.secrets_manager.secret_arn
}

data "aws_secretsmanager_secret_version" "ithc_testers" {
  secret_id = data.aws_secretsmanager_secret.ithc_testers.id
}