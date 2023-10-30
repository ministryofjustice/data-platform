module "ec2_instance_linux" {
  source = "terraform-aws-modules/ec2-instance/aws"

  name = "powerbi-testing-linux"

  instance_type          = "t3.medium"
  key_name               = "powerbi"
  monitoring             = true
  subnet_id              = "subnet-01e566dfa9e33e4c3"
  vpc_security_group_ids = [aws_security_group.powerbi.id]

  create_iam_instance_profile = true
  iam_role_description        = "IAM role for EC2 instance"
  iam_role_policies = {
    AmazonSSMManagedInstanceCore = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
  }
  # iam_instance_profile = aws_iam_instance_profile.ec2_instance_profile.name

  tags = var.tags
}
