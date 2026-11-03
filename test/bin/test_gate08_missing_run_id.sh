#!/usr/bin/env bash
set -Eeuo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TEST_DB="${TEST_DB:-guardian_prime_test}"
PSQL="${PSQL:-psql}"
SQL_FILE="$ROOT_DIR/test/sql/060_database_invariants.sql"
[[ -f "$SQL_FILE" ]] || { echo "FAIL: missing $SQL_FILE" >&2; exit 66; }

env_name="$("$PSQL" -X -A -t -v ON_ERROR_STOP=1 -d "$TEST_DB" -c "SELECT current_setting('guardian_prime.environment', true);")"
[[ "$env_name" == test ]] || { echo "FAIL: not a test database" >&2; exit 64; }

output="$(mktemp)"
trap 'rm -f "$output"' EXIT

# Invoke psql directly so backslash directives are processed deterministically.
# The negative test expects failure; it must not treat any other SQL failure as success.
unset GP_TEST_RUN_ID
set +e
"$PSQL" -X -v ON_ERROR_STOP=1 -d "$TEST_DB" -f "$SQL_FILE" >"$output" 2>&1
status=$?
set -e

if (( status == 0 )); then
  echo "FAIL: GATE-08 accepted missing GP_TEST_RUN_ID" >&2
  exit 1
fi
if ! grep -Fq 'FATAL: GP_TEST_RUN_ID is not available to GATE-08' "$output"; then
  echo "FAIL: rejection reason was not confirmed" >&2
  cat "$output" >&2
  exit 1
fi
echo "GUARDIAN_PRIME_GATE08_NEGATIVE_TEST=PASSED"
