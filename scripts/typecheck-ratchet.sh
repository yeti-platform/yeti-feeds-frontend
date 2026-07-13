#!/usr/bin/env bash
#
# Type-check ratchet.
#
# vue-tsc currently reports many type errors (the codebase predates strict
# type-checking). Rather than block everything, this fails only when the error
# count *increases* above the committed baseline, so the number can only go
# down over time. When you reduce it, lower .typecheck-baseline in the same PR
# (CI prints the new number to use).
#
# Once the baseline reaches 0, replace this with `vue-tsc --noEmit` directly
# and delete the baseline file.
set -uo pipefail

cd "$(dirname "$0")/.."
baseline=$(tr -cd '0-9' < .typecheck-baseline)

current=$(npx vue-tsc --noEmit 2>&1 | grep -cE 'error TS' || true)

echo "vue-tsc type errors: current=${current}, baseline=${baseline}"

if [ "${current}" -gt "${baseline}" ]; then
  echo "::error::Type errors increased (${baseline} -> ${current}). New type errors are not allowed."
  echo "Run 'npx vue-tsc --noEmit' locally to see them."
  exit 1
fi

if [ "${current}" -lt "${baseline}" ]; then
  echo "::warning::Type errors decreased (${baseline} -> ${current}). Set .typecheck-baseline to ${current} in this PR."
fi

echo "OK: no new type errors."
