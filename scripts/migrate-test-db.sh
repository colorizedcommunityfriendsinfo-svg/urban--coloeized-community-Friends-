#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$ROOT/scripts/lib/isolated-test-db.sh"
verify_test_cluster
# Only reviewed repository SQL is eligible. Never download SQL or infer a schema.
manifest="$ROOT/migrations/guardian-prime/SHA256SUMS"
if [[ ! -s "$manifest" ]]; then
  echo 'MIGRATION_PREREQUISITE_MISSING: migrations/guardian-prime/SHA256SUMS and audited SQL are required.' >&2
  echo 'Historical conversation drafts are not an audited migration baseline; refusing to fabricate one.' >&2
  exit 78
fi
cd "$ROOT/migrations/guardian-prime"
ordered_files="$(python3 "$ROOT/scripts/validate-guardian-prime-migrations.py" "$PWD")"
files=()
while IFS= read -r file; do
  files+=( -f "$file" )
done <<< "$ordered_files"
(( ${#files[@]} > 0 )) || exit 78
# A migration error rolls back the complete batch. No partial schema is accepted.
psql -X -v ON_ERROR_STOP=1 --single-transaction -d "$TEST_DB" "${files[@]}"
