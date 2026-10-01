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
#   CLOSE_PREVIOUS   Whether to close and unpin the previous issue with the same labels

set -euo pipefail

PROJECT_NUMBER="${PROJECT_NUMBER:-167}"
PROJECT_OWNER="${PROJECT_OWNER:-ministryofjustice}"

label_arguments=()
IFS=',' read -ra split_labels <<<"${LABELS}"
for label in "${split_labels[@]}"; do
  label_arguments+=(--label "${label}")
done

if [[ ${CLOSE_PREVIOUS:-false} == "true" ]]; then
  previous_issue_number=$(gh issue list "${label_arguments[@]}" --json number --jq '.[0].number // empty')
  if [[ -n ${previous_issue_number} ]]; then
    gh issue close "${previous_issue_number}"
    gh issue unpin "${previous_issue_number}"
  fi
fi

issue_arguments=(--title "${TITLE}" "${label_arguments[@]}" --body "${BODY}")
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

# When the built-in project auto-add runs at the same time, this can race with
# the issue creation and return "Content already exists". Give it a head start
# to reduce how often that race is actually hit.
sleep 5

project_item_add_output=$(
  gh project item-add "${PROJECT_NUMBER}" \
    --owner "${PROJECT_OWNER}" \
    --url "${new_issue_url}" \
    --format=json 2>&1 || true
)

project_item_id=$(jq -r '.id // empty' <<<"${project_item_add_output}" 2>/dev/null || true)

if [[ -z ${project_item_id} || ${project_item_id} == "null" ]]; then
  if grep -qi "Content already exists" <<<"${project_item_add_output}"; then
    issue_number="${new_issue_url##*/}"
    repo_owner="${GH_REPO%%/*}"
    repo_name="${GH_REPO#*/}"

    # Auto-add may not have finished writing the item yet, so retry briefly
    # rather than immediately giving up on the field updates.
    for _ in 1 2 3 4 5; do
      project_item_id=$(
        # shellcheck disable=SC2016 # GraphQL variables, not shell expansion
        gh api graphql \
          -f query='
            query($owner: String!, $repo: String!, $issueNumber: Int!) {
              repository(owner: $owner, name: $repo) {
                issue(number: $issueNumber) {
                  projectItems(first: 50) {
                    nodes {
                      id
                      project {
                        id
                      }
                    }
                  }
                }
              }
            }' \
          -F owner="${repo_owner}" \
          -F repo="${repo_name}" \
          -F issueNumber="${issue_number}" |
          jq -r --arg project_id "${project_id}" '
            .data.repository.issue.projectItems.nodes[]
            | select(.project.id == $project_id)
            | .id' |
          head -n 1
      )

      if [[ -n ${project_item_id} && ${project_item_id} != "null" ]]; then
        break
      fi

      sleep 2
    done

    if [[ -z ${project_item_id} || ${project_item_id} == "null" ]]; then
      echo "⚠️ Issue already exists in project, but the item ID could not be resolved. Continuing without project field updates."
      exit 0
    fi
  else
    echo "❌ Error: could not add ${new_issue_url} to project ${PROJECT_NUMBER}"
    echo "${project_item_add_output}"
    exit 1
  fi
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
