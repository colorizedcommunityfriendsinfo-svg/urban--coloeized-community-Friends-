\set ON_ERROR_STOP on
-- PS-SG-006Y-G: missing run-ID guard; this is NOT the full GATE-08 suite.
\getenv GP_TEST_RUN_ID GP_TEST_RUN_ID
\if :{?GP_TEST_RUN_ID}
\else
  DO $guard$ BEGIN
    RAISE EXCEPTION 'FATAL: GP_TEST_RUN_ID is not available to GATE-08';
  END $guard$;
\endif

-- Fail closed on empty or malformed IDs. The shell gate must treat any
-- failed pgTAP assertion as a nonzero result.
SELECT plan(2);
SELECT ok(
  :'GP_TEST_RUN_ID' ~ '^[A-Za-z0-9._-]+$',
  'GATE-08 run ID is nonempty and valid'
);
SELECT is(
  (SELECT count(*)::integer FROM pg_catalog.pg_stat_activity
   WHERE datname = pg_catalog.current_database()
     AND pid <> pg_catalog.pg_backend_pid()
     AND left(application_name,
       length('gp_pgtap_concurrency_' || :'GP_TEST_RUN_ID' || '_'))
       = 'gp_pgtap_concurrency_' || :'GP_TEST_RUN_ID' || '_'),
  0,
  'No run-scoped concurrency sessions remain'
);
SELECT * FROM finish();
