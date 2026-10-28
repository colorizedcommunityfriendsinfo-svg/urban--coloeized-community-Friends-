#!/usr/bin/env bash
set -Eeuo pipefail
echo "Guardian Prime database provisioning/migrations are not configured." >&2
echo "Failing closed: supply isolated PostgreSQL, pgTAP, dblink and audited migrations." >&2
exit 78
