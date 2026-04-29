#!/usr/bin/env bash

set -euo pipefail

# Install pre-commit hooks
uvx pre-commit install

# Install kubeconfig and AWS SSO EKS auth helper
install --mode=0600 .devcontainer/src/kubernetes/config /home/vscode/.kube/config

sudo install --mode=0770 --owner=vscode --group=vscode .devcontainer/src/kubernetes/aws-sso-eks-auth.sh /usr/local/bin/aws-sso-eks-auth
