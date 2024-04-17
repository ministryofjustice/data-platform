resource "aws_athena_workgroup" "airflow_dev" {
  name = "airflow-dev-workgroup"

  configuration {
    bytes_scanned_cutoff_per_query  = 1099511627776
    enforce_workgroup_configuration = true
    engine_version {
      selected_engine_version = "Athena engine version 3"
    }
    result_configuration {
      output_location = "s3://dbt-query-dump/"
    }
  }

  tags = merge(var.tags,
    {
      "Name"             = "airflow-dev-workgroup"
      "application"      = "airflow"
      "environment-name" = "dev"
      "is-production"    = "true"
      "owner"            = "Data Engineering:dataengineering@digital.justice.gov.uk"
    }
  )
}

resource "aws_athena_workgroup" "airflow_prod" {
  name = "airflow-prod-workgroup"

  configuration {
    bytes_scanned_cutoff_per_query  = 1099511627776
    enforce_workgroup_configuration = true
    engine_version {
      selected_engine_version = "Athena engine version 3"
    }
    result_configuration {
      output_location = "s3://dbt-query-dump/"
    }
  }

  tags = merge(var.tags,
    {
      "Name"             = "airflow-prod-workgroup"
      "application"      = "airflow"
      "environment-name" = "prod"
      "is-production"    = "true"
      "owner"            = "Data Engineering:dataengineering@digital.justice.gov.uk"
    }
  )
}

resource "aws_athena_workgroup" "airflow_dev_hmcts" {
  name = "airflow-dev-workgroup-hmcts"

  configuration {
    bytes_scanned_cutoff_per_query  = 1099511627776
    enforce_workgroup_configuration = true
    engine_version {
      selected_engine_version = "Athena engine version 3"
    }
    result_configuration {
      output_location = "s3://dbt-query-dump/"
    }
  }

  tags = merge(var.tags,
    {
      "Name"             = "airflow-dev-workgroup-hmcts"
      "application"      = "airflow"
      "environment-name" = "dev"
      "is-production"    = "true"
      "owner"            = "Data Engineering:dataengineering@digital.justice.gov.uk"
      "business-unit"    = "HMCTS"
    }
  )
}

resource "aws_athena_workgroup" "airflow_prod_hmcts" {
  name = "airflow-prod-workgroup-hmcts"

  configuration {
    bytes_scanned_cutoff_per_query  = 1099511627776
    enforce_workgroup_configuration = true
    engine_version {
      selected_engine_version = "Athena engine version 3"
    }
    result_configuration {
      output_location = "s3://dbt-query-dump/"
    }
  }

  tags = merge(var.tags,
    {
      "Name"             = "airflow-prod-workgroup"
      "application"      = "airflow"
      "environment-name" = "prod"
      "is-production"    = "true"
      "owner"            = "Data Engineering:dataengineering@digital.justice.gov.uk"
      "business-unit"    = "HMCTS"
    }
  )
}
