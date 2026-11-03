BEGIN;
SELECT plan(5);
SELECT has_schema('guardian_prime');
SELECT has_schema('guardian_prime_api');
SELECT has_table('guardian_prime','command_idempotency');
SELECT has_function('guardian_prime_api','claim_command',ARRAY['text','text','text','text','text']);
SELECT has_function('guardian_prime_api','get_command_result',ARRAY['text','text','text']);
SELECT * FROM finish();
ROLLBACK;
