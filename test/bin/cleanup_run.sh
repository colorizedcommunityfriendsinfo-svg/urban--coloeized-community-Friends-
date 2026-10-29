#!/usr/bin/env bash
set -Eeuo pipefail
: "${GP_TEST_RUN_ID:?GP_TEST_RUN_ID required}"
[[ "$GP_TEST_RUN_ID" =~ ^[A-Za-z0-9._-]+$ ]] || exit 64
: "${TEST_DB:?TEST_DB required}"
PSQL="${PSQL:-psql}"
[[ "$("$PSQL" -XAt -v ON_ERROR_STOP=1 -d "$TEST_DB" -c "SELECT current_setting('guardian_prime.environment',true)")" == test ]] || exit 64
# stdin enables psql quoting/interpolation; -c would send :'run_id' literally.
# Separate requests commit session cleanup before row cleanup begins.
"$PSQL" -X -v ON_ERROR_STOP=1 -d "$TEST_DB" -v run_id="$GP_TEST_RUN_ID" <<'SQL'
SELECT guardian_prime_test.cleanup_concurrency_sessions(:'run_id');
SELECT guardian_prime_test.cleanup_idempotency_concurrency(:'run_id');
SQL
