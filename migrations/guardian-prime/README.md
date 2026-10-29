# Audited Guardian Prime migration prerequisite

No deployable migration baseline exists on this branch. Provisioning creates
only a fresh PostgreSQL 16 database and pgTAP/dblink extensions. It does not
construct application tables from test expectations.

Before the full gate can run, commit reviewed, ordered SQL files here with a
`SHA256SUMS` manifest (one lowercase SHA-256, two spaces, and a filename per line).
Names must be `NNN_lowercase_name.sql`. Manifest order is execution order.
Checksums detect accidental changes; they do not constitute a security audit.
Review the SQL and record its source/reviewer before adding the manifest.
Migrations must support one transaction, have no psql shell/meta-command escapes,
and must not commit independently or connect to another database.

The reviewed baseline must define Guardian Prime schemas, idempotency types and
tables, claim/result APIs, trusted project/actor context, role ownership and grants,
forced tenant RLS policies, pinned SECURITY DEFINER search paths, and test-only
run-scoped cleanup functions. Cleanup must verify test environment, terminate only
this database's exact run-prefix sessions, and delete only the reserved test
project's exact run-prefix rows. Avoid LIKE wildcard prefix matching.

The runner also requires missing tests `010_idempotency_basic.sql`,
`020_idempotency_rollback.sql`, `030_idempotency_retrieval.sql`, and
`ps_sg_006y_idempotency_concurrency.sql`. Recover/review these with the baseline;
do not add empty tests. The existing GATE-08 file is explicitly partial and still
needs the complete catalog/security invariants. Existing privilege and RLS flag
checks do not replace behavioral tenant-isolation tests.

Concurrency connections must explicitly target the private socket in PGHOST,
port PGPORT and database TEST_DB. The cluster has no TCP listener. Peer auth
identifies the OS runner; the privileged harness must exercise runtime boundaries
with reviewed roles, not infer safety from a privileged session's successful query.
Do not enable trust, grant runtime superuser/BYPASSRLS, or relax production controls.
