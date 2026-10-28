#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TEST_DB="${TEST_DB:-guardian_prime_test}"
PSQL="${PSQL:-psql}"
PG_PROVE="${PG_PROVE:-pg_prove}"
GP_TEST_RUN_ID="${GP_TEST_RUN_ID:-${GITHUB_RUN_ID:-local-$(date +%s)-$$}}"
export GP_TEST_RUN_ID
fail(){ echo "GUARDIAN_PRIME_DB_GATE=FAILED"; echo "FAILED_STAGE=$1"; exit 1; }
[[ "$GP_TEST_RUN_ID" =~ ^[A-Za-z0-9._-]+$ ]] || fail RUN_ID
environment="$("$PSQL" -X -A -t -v ON_ERROR_STOP=1 -d "$TEST_DB" -c "SELECT current_setting('guardian_prime.environment',true)")" || fail ENVIRONMENT
[[ "$environment" == test ]] || fail ENVIRONMENT
for file in 001_schema_validation.sql 010_idempotency_basic.sql 020_idempotency_rollback.sql 030_idempotency_retrieval.sql 040_privilege_boundaries.sql 050_rls_tenant_isolation.sql; do
  [[ -f "$ROOT/test/sql/$file" ]] || fail "MISSING_$file"
  "$PG_PROVE" --dbname "$TEST_DB" "$ROOT/test/sql/$file" || fail "$file"
done
[[ -f "$ROOT/test/bin/run_ps_sg_006y_concurrency.sh" ]] || fail CONCURRENCY_WRAPPER_MISSING
bash "$ROOT/test/bin/run_ps_sg_006y_concurrency.sh" || fail CONCURRENCY
# Exact-prefix comparison avoids LIKE wildcard collisions.
counts="$("$PSQL" -X -A -t -v ON_ERROR_STOP=1 -d "$TEST_DB" -v run_id="$GP_TEST_RUN_ID" -c "
SELECT
 (SELECT count(*) FROM guardian_prime.command_idempotency
  WHERE project_id='PROJECT-SHINE-PGTAP-CONCURRENCY'
    AND left(command_id,length('PGTAP-CONC:' || :'run_id' || ':'))
       = 'PGTAP-CONC:' || :'run_id' || ':')::text
 || ':' ||
 (SELECT count(*) FROM pg_catalog.pg_stat_activity
  WHERE datname=current_database()
    AND pid<>pg_backend_pid()
    AND left(application_name,length('gp_pgtap_concurrency_' || :'run_id' || '_'))
       = 'gp_pgtap_concurrency_' || :'run_id' || '_')::text;
")" || fail CLEANUP_QUERY
[[ "$counts" == "0:0" ]] || fail CLEANUP_REMAINS
"$PG_PROVE" --dbname "$TEST_DB" "$ROOT/test/sql/060_database_invariants.sql" || fail DATABASE_INVARIANTS
echo "GUARDIAN_PRIME_DB_GATE=PASSED"
