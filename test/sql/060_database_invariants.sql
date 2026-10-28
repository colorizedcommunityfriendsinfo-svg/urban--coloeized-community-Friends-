-- PS-SG-006Y-G: mandatory missing-run-ID guard
\getenv GP_TEST_RUN_ID GP_TEST_RUN_ID
\if :{?GP_TEST_RUN_ID}
\else
  \echo 'FATAL: GP_TEST_RUN_ID is not available to GATE-08'
  \quit 3
\endif
\if :'GP_TEST_RUN_ID' == ''
  \echo 'FATAL: GP_TEST_RUN_ID must not be empty'
  \quit 3
\endif

-- This file is a bootstrap placeholder, NOT a completed GATE-08 suite.
-- Add the PS-SG-006Y-F schema, RLS, privileges, and invariants tests
-- before marking the overall Guardian Prime database gate as passing.
SELECT plan(2);
SELECT ok(
  :'GP_TEST_RUN_ID' ~ '^[A-Za-z0-9._-]+$',
  'GATE-08 run ID is valid'
);
SELECT is(
  (SELECT count(*)::integer FROM pg_catalog.pg_stat_activity
    WHERE datname = pg_catalog.current_database()
      AND pid <> pg_catalog.pg_backend_pid()
      AND left(application_name,
          length('gp_pgtap_concurrency_' || :'GP_TEST_RUN_ID' || '_'))
        = 'gp_pgtap_concurrency_' || :'GP_TEST_RUN_ID' || '_'),
  0, 'No run-scoped concurrency sessions remain'
);
SELECT * FROM finish();
