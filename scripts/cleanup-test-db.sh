#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$ROOT/scripts/lib/isolated-test-db.sh"
# No provisioning attempt means there can be no sessions or fixtures to clean.
if [[ ! -e "$GP_TEST_CLUSTER_ROOT" ]]; then
  echo 'Cleanup: no isolated cluster was created.'
  exit 0
fi
[[ -d "$GP_TEST_CLUSTER_ROOT" && ! -L "$GP_TEST_CLUSTER_ROOT" && -O "$GP_TEST_CLUSTER_ROOT" ]] || exit 64
[[ "$(cat "$GP_TEST_CLUSTER_ROOT/run-id")" == "$GP_TEST_RUN_ID" ]] || exit 64
stop_cluster() {
  local status=$?
  trap - EXIT
  if [[ -f "$GP_TEST_CLUSTER_ROOT/data/postmaster.pid" ]]; then
    pg_ctl -D "$GP_TEST_CLUSTER_ROOT/data" -m immediate -w -t 30 stop || status=1
  fi
  exit "$status"
}
trap stop_cluster EXIT
# Helpers cannot exist before a successful atomic migration. Stop the private
# cluster regardless, without connecting to an absent or half-built database.
if [[ "${GP_MIGRATIONS_APPLIED:-false}" != true ]]; then
  echo 'Cleanup: migrations did not complete; stopping only this run-owned cluster.'
  exit 0
fi
verify_test_cluster
bash "$ROOT/test/bin/cleanup_run.sh"
