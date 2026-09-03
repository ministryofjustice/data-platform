#!/usr/bin/env bash

# Creates a recurring maintenance issue and places it on the Justice Data
# Platform project board with sensible default field values.
#
# Required environment variables:
#   GH_TOKEN         Token with issues:write on GH_REPO and project write on PROJECT_OWNER
#   GH_REPO          Repository to create the issue in, in owner/repo form
#   TITLE            Issue title
#   BODY             Issue body
#   LABELS           Comma separated list of labels
#   ASSIGNEES        Comma separated list of assignees, may be empty
#   PINNED           Whether to pin the new issue
#   CLOSE_PREVIOUS   Whether to close and unpin the previous issue with the same label

set -euo pipefail

PROJECT_NUMBER="${PROJECT_NUMBER:-167}"
PROJECT_OWNER="${PROJECT_OWNER:-ministryofjustice}"

if [[ ${CLOSE_PREVIOUS:-false} == "true" ]]; then
  previous_issue_number=$(gh issue list --label "${LABELS}" --json number --jq '.[0].number // empty')
  if [[ -n ${previous_issue_number} ]]; then
    gh issue close "${previous_issue_number}"
    gh issue unpin "${previous_issue_number}"
  fi
fi

issue_arguments=(--title "${TITLE}" --label "${LABELS}" --body "${BODY}")
if [[ -n ${ASSIGNEES:-} ]]; then
  issue_arguments+=(--assignee "${ASSIGNEES}")
fi

new_issue_url=$(gh issue create "${issue_arguments[@]}")
echo "Created new issue: ${new_issue_url}"

if [[ ${PINNED:-false} == "true" ]]; then
  gh issue pin "${new_issue_url}"
fi

project_view=$(gh project view "${PROJECT_NUMBER}" --owner "${PROJECT_OWNER}" --format=json)
project_id=$(jq -r '.id' <<<"${project_view}")
if [[ -z ${project_id} || ${project_id} == "null" ]]; then
  echo "❌ Error: could not resolve project ID for project ${PROJECT_NUMBER}"
  exit 1
fi

# addProjectV2ItemById is idempotent, so this is safe even when the project's
# built in auto-add workflow has already placed the issue on the board.
project_item_id=$(gh project item-add "${PROJECT_NUMBER}" \
  --owner "${PROJECT_OWNER}" \
  --url "${new_issue_url}" \
  --format=json | jq -r '.id')
if [[ -z ${project_item_id} || ${project_item_id} == "null" ]]; then
  echo "❌ Error: could not add ${new_issue_url} to project ${PROJECT_NUMBER}"
  exit 1
fi

field_list=$(gh project field-list "${PROJECT_NUMBER}" --owner "${PROJECT_OWNER}" --format=json)

set_single_select_field() {
  local field_name="${1}"
  local option_name="${2}"
  local field_id
  local option_id

  field_id=$(jq -r --arg field "${field_name}" \
    '.fields[] | select(.name == $field) | .id' <<<"${field_list}")
  option_id=$(jq -r --arg field "${field_name}" --arg option "${option_name}" \
    '.fields[] | select(.name == $field) | .options[] | select(.name == $option) | .id' <<<"${field_list}")

  if [[ -z ${field_id} || -z ${option_id} ]]; then
    echo "❌ Error: could not resolve field '${field_name}' option '${option_name}'"
    exit 1
  fi

  gh project item-edit \
    --project-id "${project_id}" \
    --id "${project_item_id}" \
    --field-id "${field_id}" \
    --single-select-option-id "${option_id}"
}

set_single_select_field "Status" "TODO"
set_single_select_field "Refined" "Yes"
set_single_select_field "Priority" "Medium"

echo "🎉 Updated Justice Data Platform project item ${new_issue_url} fields: Status, Refined, Priority"
