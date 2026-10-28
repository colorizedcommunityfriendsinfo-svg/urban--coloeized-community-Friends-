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
