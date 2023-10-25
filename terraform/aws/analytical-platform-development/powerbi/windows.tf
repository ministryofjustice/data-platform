module "ec2_instance" {
  source = "terraform-aws-modules/ec2-instance/aws"

  name = "powerbi-testing"

  instance_type          = "t2.small"
  key_name               = "powerbi"
  monitoring             = true
  subnet_id              = "subnet-01e566dfa9e33e4c3"
  vpc_security_group_ids = [aws_security_group.powerbi.id]

  ami = "ami-0d8e82a3d7fda95e0" # Windows Server 2022 Base

  create_iam_instance_profile = true
  iam_role_description        = "IAM role for EC2 instance"
  iam_role_policies = {
    AmazonSSMManagedInstanceCore = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
  }

  tags = var.tags
}

