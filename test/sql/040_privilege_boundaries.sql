BEGIN;
SELECT plan(4);
SELECT ok(NOT has_table_privilege('gp_runtime','guardian_prime.command_idempotency','INSERT'),'Runtime cannot insert idempotency rows');
SELECT ok(NOT has_table_privilege('gp_runtime','guardian_prime.command_idempotency','UPDATE'),'Runtime cannot update idempotency rows');
SELECT ok(NOT has_table_privilege('gp_runtime','guardian_prime.command_idempotency','DELETE'),'Runtime cannot delete idempotency rows');
SELECT ok(NOT pg_has_role('gp_runtime','gp_function_owner','MEMBER'),'Runtime is not a member of privileged owner');
SELECT * FROM finish();
ROLLBACK;
