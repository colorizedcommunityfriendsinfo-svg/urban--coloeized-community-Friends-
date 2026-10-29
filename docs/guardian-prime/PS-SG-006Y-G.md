# PS-SG-006Y-G — Missing run-ID regression test

This is a development-branch bootstrap, not a completed production database gate.

## Required test
`test/bin/test_gate08_missing_run_id.sh` verifies that GATE-08 rejects a missing `GP_TEST_RUN_ID` with a nonzero exit and the specific fatal message.

## Preconditions
An isolated PostgreSQL test database with `guardian_prime.environment=test`, pgTAP, pg_prove, and the Guardian Prime schemas. No production deployment is authorized.

## CI order
Run the negative test before the full PS-SG-006Y-F database gate. Missing or failed tests must block merge/deployment.

## Follow-up
Implement the remaining GATE-08 catalog invariants, ordinary idempotency tests, privilege/RLS tests, and full concurrency cleanup gate. Do not report the full gate as passing while these are absent.

## 2026-10-29 isolated provisioning repair

CI now installs PostgreSQL 16, pgTAP/pg_prove and starts a fresh run-owned cluster
under RUNNER_TEMP. Only a private Unix socket is enabled; local peer authentication
is required and TCP authentication is reject. No production secrets or endpoints
are consumed. A database environment marker and exact server data-directory check
protect the migration entry point. Existing cluster directories are never reused.

The missing-run-ID negative test runs immediately after extension provisioning,
before application migrations, so its guard is independently exercised even while
the application migration prerequisite is missing. The full gate still requires
successful migrations and all existing assertions. Run-scoped cleanup uses psql
stdin variable quoting, then the always-run finalizer stops only the private
cluster. Failed provisioning/migration does not invoke nonexistent SQL helpers.

The application schema is still blocked: see migrations/guardian-prime/README.md.
The recovered conversation source identifies itself as unvalidated historical
drafts and depends on unresolved trusted-context and role definitions. It has not
been promoted to an audited migration. Passing infrastructure/guard tests is not
a passing full safety gate. No production deployment is part of this repair.
