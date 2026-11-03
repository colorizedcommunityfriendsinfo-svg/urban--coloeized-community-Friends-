BEGIN;
SELECT plan(2);
SELECT ok((SELECT relrowsecurity FROM pg_catalog.pg_class WHERE oid='guardian_prime.command_idempotency'::regclass),'Idempotency RLS enabled');
SELECT ok((SELECT relforcerowsecurity FROM pg_catalog.pg_class WHERE oid='guardian_prime.command_idempotency'::regclass),'Idempotency RLS forced');
SELECT * FROM finish();
ROLLBACK;
