#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$ROOT/scripts/lib/isolated-test-db.sh"
for program in initdb pg_ctl psql createdb pg_prove; do command -v "$program" >/dev/null; done
umask 077
# mkdir must fail on reuse: never attach to or reset an existing cluster.
mkdir "$GP_TEST_CLUSTER_ROOT"
printf '%s\n' "$GP_TEST_RUN_ID" > "$GP_TEST_CLUSTER_ROOT/run-id"
mkdir "$PGHOST"
cleanup_failure() {
  local status=$?
  trap - EXIT
  if (( status != 0 )) && [[ -f "$GP_TEST_CLUSTER_ROOT/data/postmaster.pid" ]]; then
    pg_ctl -D "$GP_TEST_CLUSTER_ROOT/data" -m immediate -w stop || echo 'ERROR: failed to stop partially provisioned test cluster' >&2
  fi
  exit "$status"
}
trap cleanup_failure EXIT
initdb -D "$GP_TEST_CLUSTER_ROOT/data" --auth-local=peer --auth-host=reject --encoding=UTF8 --no-locale
cat >> "$GP_TEST_CLUSTER_ROOT/data/postgresql.conf" <<CONF
listen_addresses = ''
unix_socket_directories = '$PGHOST'
unix_socket_permissions = 0700
port = 5432
CONF
pg_ctl -D "$GP_TEST_CLUSTER_ROOT/data" -l "$GP_TEST_CLUSTER_ROOT/postgres.log" -w -t 30 start
createdb --template=template0 "$TEST_DB"
psql -X -v ON_ERROR_STOP=1 -d postgres <<'SQL'
REVOKE CONNECT ON DATABASE guardian_prime_test FROM PUBLIC;
ALTER DATABASE guardian_prime_test SET guardian_prime.environment = 'test';
SQL
psql -X -v ON_ERROR_STOP=1 -d "$TEST_DB" <<'SQL'
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
CREATE EXTENSION pgtap;
CREATE EXTENSION dblink;
SQL
verify_test_cluster
echo 'ISOLATED_POSTGRESQL_PROVISIONING=PASSED'
