#!/usr/bin/env bash
# Source only from test tooling. Never accept a caller-provided database URL.
: "${RUNNER_TEMP:?RUNNER_TEMP required}"
: "${GP_TEST_RUN_ID:?GP_TEST_RUN_ID required}"
[[ "$GP_TEST_RUN_ID" =~ ^[A-Za-z0-9._-]{1,80}$ ]] || return 64
[[ "$RUNNER_TEMP" == /* && "$RUNNER_TEMP" != *"'"* && "$RUNNER_TEMP" != *$'\n'* ]] || return 64
GP_TEST_CLUSTER_ROOT="$RUNNER_TEMP/gp-db-$GP_TEST_RUN_ID"
export TEST_DB=guardian_prime_test
export PGHOST="$GP_TEST_CLUSTER_ROOT/socket" PGPORT=5432 PGUSER="$(id -un)"
export PGDATABASE="$TEST_DB" PGCONNECT_TIMEOUT=5
unset PGHOSTADDR PGSERVICE PGSERVICEFILE PGOPTIONS PGPASSWORD PGPASSFILE
export PATH="/usr/lib/postgresql/16/bin:$PATH"
verify_test_cluster() {
  [[ -d "$GP_TEST_CLUSTER_ROOT" && ! -L "$GP_TEST_CLUSTER_ROOT" && -O "$GP_TEST_CLUSTER_ROOT" ]] || return 64
  [[ "$(cat "$GP_TEST_CLUSTER_ROOT/run-id")" == "$GP_TEST_RUN_ID" ]] || return 64
  local identity
  identity="$(psql -XAt -v ON_ERROR_STOP=1 -d "$TEST_DB" -c "SELECT current_setting('data_directory') || '|' || current_setting('guardian_prime.environment',true) || '|' || current_database()")" || return
  [[ "$identity" == "$GP_TEST_CLUSTER_ROOT/data|test|$TEST_DB" ]]
}
