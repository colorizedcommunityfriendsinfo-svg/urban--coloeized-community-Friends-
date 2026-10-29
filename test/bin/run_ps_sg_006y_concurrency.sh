#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TEST_DB="${TEST_DB:-guardian_prime_test}"
PSQL="${PSQL:-psql}"
PG_PROVE="${PG_PROVE:-pg_prove}"
GP_TEST_RUN_ID="${GP_TEST_RUN_ID:?GP_TEST_RUN_ID required}"
[[ "$GP_TEST_RUN_ID" =~ ^[A-Za-z0-9._-]+$ ]] || exit 64
export GP_TEST_RUN_ID
env_name="$("$PSQL" -X -A -t -v ON_ERROR_STOP=1 -d "$TEST_DB" -c "SELECT current_setting('guardian_prime.environment',true)")"
[[ "$env_name" == test ]] || exit 64
cleanup() {
  local prior=$? result=0
  trap - EXIT
  set +e
  bash "$ROOT/test/bin/cleanup_run.sh" || result=1
  if (( prior == 0 && result != 0 )); then prior=1; fi
  exit "$prior"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
test -f "$ROOT/test/sql/ps_sg_006y_idempotency_concurrency.sql" || { echo "Concurrency test missing; fail closed" >&2; exit 66; }
bash "$ROOT/test/bin/cleanup_run.sh"
"$PG_PROVE" --dbname "$TEST_DB" "$ROOT/test/sql/ps_sg_006y_idempotency_concurrency.sql"
