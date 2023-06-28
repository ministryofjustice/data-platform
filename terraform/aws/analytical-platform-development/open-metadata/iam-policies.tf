data "aws_iam_policy_document" "open_metadata_airflow" {
  statement {
    sid       = "AllowAssumeRole"
    effect    = "Allow"
    actions   = ["sts:AssumeRole"]
    resources = ["arn:aws:iam::593291632749:role/open-metadata-airflow20230623105404064900000001"]
  }
}

module "open_metadata_airflow_iam_policy" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-policy"
  version = "5.22.0"

  name_prefix = "open-metadata-airflow"

  policy = data.aws_iam_policy_document.open_metadata_airflow.json
}
