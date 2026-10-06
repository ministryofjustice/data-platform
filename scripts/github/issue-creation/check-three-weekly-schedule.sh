#!/usr/bin/env bash

# Cron cannot express a three weekly cadence, so the weekly trigger is filtered
# here. Writes run=true/false to GITHUB_OUTPUT.
#
# Optional environment variables:
#   ANCHOR_DATE  First scheduled run, in YYYY-MM-DD form

set -euo pipefail

ANCHOR_DATE="${ANCHOR_DATE:-2026-10-13}"

if [[ ${GITHUB_EVENT_NAME:-} != "schedule" ]]; then
  echo "run=true" >>"${GITHUB_OUTPUT}"
  exit 0
fi

anchor=$(date -u -d "${ANCHOR_DATE}" +%s)
today=$(date -u -d "$(date -u +%Y-%m-%d)" +%s)
weeks=$(((today - anchor) / 604800))

if ((today >= anchor && weeks % 3 == 0)); then
  echo "run=true" >>"${GITHUB_OUTPUT}"
  echo "✅ Week ${weeks} since ${ANCHOR_DATE} is a scheduled week."
else
  echo "run=false" >>"${GITHUB_OUTPUT}"
  echo "⏭️ Not a scheduled week, skipping."
fi
