module "ec2_instance" {
  source = "terraform-aws-modules/ec2-instance/aws"

  name = "powerbi-testing"

  instance_type          = "t2.micro"
  key_name               = "user1"
  monitoring             = true
  vpc_security_group_ids = [module.vpc.default_security_group_id]
  subnet_id              = join(",", module.vpc.public_subnets)

  ami  = "ami-0d8e82a3d7fda95e0" # Windows Server 2022 Base
  tags = var.tags
}

