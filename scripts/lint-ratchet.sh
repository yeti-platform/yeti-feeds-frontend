#!/usr/bin/env bash
set -uo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
frontend_root="${YETI_FRONTEND_ROOT:-$(cd "$script_dir/.." && pwd)}"
cd "$frontend_root" || exit 1

baseline="$(tr -cd '0-9' < .lint-baseline)"
output="$(npx eslint . --no-color 2>&1)"
eslint_status=$?

if [[ "$eslint_status" -eq 0 ]]; then
  current=0
else
  current="$(printf '%s\n' "$output" | sed -nE 's/.*\(([0-9]+) errors?, [0-9]+ warnings?\).*/\1/p' | tail -n 1)"
  if [[ -z "$current" ]]; then
    printf '%s\n' "$output"
    printf '\nESLint failed before reporting a result.\n'
    exit "$eslint_status"
  fi
fi

printf 'ESLint errors: current=%s, baseline=%s\n' "$current" "$baseline"

if [[ "$current" -gt "$baseline" ]]; then
  printf '%s\n' "$output"
  printf '\nESLint errors increased (%s -> %s). New lint errors are not allowed.\n' "$baseline" "$current"
  exit 1
fi

if [[ "$current" -lt "$baseline" ]]; then
  printf 'ESLint errors decreased (%s -> %s). Update .lint-baseline in this change.\n' "$baseline" "$current"
fi

printf 'OK: no new ESLint errors.\n'
