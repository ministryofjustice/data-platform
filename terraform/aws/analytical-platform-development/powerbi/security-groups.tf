resource "aws_security_group" "powerbi" {
  name        = "powerbi"
  description = "allow powerbi to connect to the internet + sessions manager"
  vpc_id      = "vpc-085ebd0bdd98a986c"
  # ingress {
  #   from_port   = 443
  #   to_port     = 443
  #   protocol    = "tcp"
  #   cidr_blocks = ["10.124.0.0/16"]
  # }
  # ingress {
  #   from_port   = 444
  #   to_port     = 444
  #   protocol    = "tcp"
  #   cidr_blocks = ["0.0.0.0/0"]
  # }
  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
