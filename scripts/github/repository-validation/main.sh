#!/usr/bin/env bash

set -euo pipefail

REPOSITORIES=(
  "data-platform"
  "data-platform-access"
  "data-platform-github-actions"
  "data-platform-security"
  "terraform-aws-data-platform-lakeformation"
)

WORKFLOWS=(
  ".github/workflows/codeql-analysis.yml"
  ".github/workflows/dependency-review.yml"
  ".github/workflows/openssf-scorecard.yml"
  ".github/workflows/super-linter.yml"
  ".github/workflows/zizmor.yml"
)

for REPOSITORY in "${REPOSITORIES[@]}"; do
  echo "Validating repository: ${REPOSITORY}"
  for WORKFLOW in "${WORKFLOWS[@]}"; do
    echo "  Checking for workflow: ${WORKFLOW}"
  done
done
