"""Offline guard tests; these do not claim to exercise PostgreSQL or pgTAP."""
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]


class ProvisioningSafety(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.env = dict(os.environ, RUNNER_TEMP=self.tmp.name, GP_TEST_RUN_ID='guard-1')

    def run_script(self, script):
        return subprocess.run(['bash', str(ROOT / script)], env=self.env,
                              text=True, capture_output=True)

    def test_no_cluster_cleanup_does_not_connect(self):
        result = self.run_script('scripts/cleanup-test-db.sh')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn('no isolated cluster', result.stdout)

    def test_missing_run_id_rejected(self):
        self.env.pop('GP_TEST_RUN_ID')
        self.assertNotEqual(self.run_script('scripts/cleanup-test-db.sh').returncode, 0)

    def test_path_traversal_rejected(self):
        self.env['GP_TEST_RUN_ID'] = '../other-run'
        self.assertNotEqual(self.run_script('scripts/cleanup-test-db.sh').returncode, 0)

    def test_foreign_run_marker_rejected(self):
        cluster = Path(self.tmp.name) / 'gp-db-guard-1'
        cluster.mkdir()
        (cluster / 'run-id').write_text('other-run\n')
        self.assertNotEqual(self.run_script('scripts/cleanup-test-db.sh').returncode, 0)

    def test_symlink_cluster_rejected(self):
        (Path(self.tmp.name) / 'gp-db-guard-1').symlink_to(self.tmp.name)
        self.assertNotEqual(self.run_script('scripts/cleanup-test-db.sh').returncode, 0)

    def test_partial_initialization_does_not_query_helpers(self):
        cluster = Path(self.tmp.name) / 'gp-db-guard-1'
        cluster.mkdir()
        (cluster / 'run-id').write_text('guard-1\n')
        result = self.run_script('scripts/cleanup-test-db.sh')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn('migrations did not complete', result.stdout)

    def test_external_connection_settings_are_replaced(self):
        self.env.update(PGHOST='production.invalid', PGHOSTADDR='192.0.2.1',
                        PGSERVICE='production', PGOPTIONS='-c search_path=unsafe',
                        TEST_DB='postgresql://production.invalid/app')
        result = subprocess.run(['bash', '-c',
            'source scripts/lib/isolated-test-db.sh; '
            'printf "%s|%s|%s|%s|%s" "$PGHOST" "$TEST_DB" '
            '"${PGHOSTADDR-unset}" "${PGSERVICE-unset}" "${PGOPTIONS-unset}"'],
            cwd=ROOT, env=self.env, text=True, capture_output=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout,
            f'{self.tmp.name}/gp-db-guard-1/socket|guardian_prime_test|unset|unset|unset')


if __name__ == '__main__':
    unittest.main()
