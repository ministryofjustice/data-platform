resource "aws_iam_role" "ec2_role" {
  name = "EC2Role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Service = "ec2.amazonaws.com"
        },
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_policy" "s3_and_athena_policy" {
  name        = "S3AndAthenaPolicy"
  description = "My policy that grants access to S3 and Athena"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = [
          "s3:ListBucket",
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject"
        ],
        Effect   = "Allow",
        Resource = "arn:aws:s3:::powerbi-123123123/*"
      },
      {
        Action = [
          "athena:StartQueryExecution",
          "athena:GetQueryResults",
          "athena:GetQueryExecution"
        ],
        Effect   = "Allow",
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "attach_s3_and_athena_policy" {
  policy_arn = aws_iam_policy.s3_and_athena_policy.arn
  role       = aws_iam_role.ec2_role.name
}
