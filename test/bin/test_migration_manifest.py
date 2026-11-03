"""Offline file-integrity tests, not PostgreSQL or pgTAP regression tests."""
import hashlib
import importlib.util
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts/validate-guardian-prime-migrations.py"
SPEC = importlib.util.spec_from_file_location("migration_manifest", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class MigrationManifest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.directory = Path(self.temp.name)
        self.manifest = self.directory / "SHA256SUMS"

    def entry(self, name="001_first.sql", content=b"-- file-integrity fixture only\n"):
        (self.directory / name).write_bytes(content)
        return f"{hashlib.sha256(content).hexdigest()}  {name}\n"

    def write(self, text):
        self.manifest.write_bytes(text.encode("ascii"))

    def reject(self):
        with self.assertRaises((ValueError, OSError, UnicodeError)):
            MODULE.validate(self.directory)

    def test_valid_order_and_bytes(self):
        self.write(self.entry() + self.entry("010_second.sql"))
        self.assertEqual(MODULE.validate(self.directory), ["001_first.sql", "010_second.sql"])

    def test_missing_manifest(self):
        self.reject()

    def test_empty_manifest(self):
        self.write("")
        self.reject()

    def test_unterminated_manifest(self):
        self.write(self.entry().rstrip("\n"))
        self.reject()

    def test_crlf_manifest(self):
        self.write(self.entry().replace("\n", "\r\n"))
        self.reject()

    def test_blank_line(self):
        self.write(self.entry() + "\n")
        self.reject()

    def test_noncanonical_spacing(self):
        entry = self.entry()
        for separator in (" ", "   ", "\t"):
            with self.subTest(separator=repr(separator)):
                self.write(entry.replace("  ", separator))
                self.reject()

    def test_uppercase_digest(self):
        entry = self.entry()
        self.write(entry[:64].upper() + entry[64:])
        self.reject()

    def test_non_ascii(self):
        self.manifest.write_bytes(b"\xff\n")
        self.reject()

    def test_duplicate_file(self):
        entry = self.entry()
        self.write(entry + entry)
        self.reject()

    def test_duplicate_sequence(self):
        self.write(self.entry() + self.entry("001_other.sql"))
        self.reject()

    def test_reversed_order(self):
        self.write(self.entry("010_second.sql") + self.entry())
        self.reject()

    def test_hash_mismatch(self):
        self.write(self.entry())
        (self.directory / "001_first.sql").write_bytes(b"changed after review\n")
        self.reject()

    def test_missing_sql(self):
        self.write(self.entry())
        (self.directory / "001_first.sql").unlink()
        self.reject()

    def test_empty_sql(self):
        for content in (b"", b" \n\t"):
            with self.subTest(content=content):
                self.write(self.entry(content=content))
                self.reject()

    def test_unlisted_sql(self):
        self.write(self.entry())
        self.entry("002_unlisted.sql")
        self.reject()

    def test_uppercase_unlisted_sql(self):
        self.write(self.entry())
        self.entry("002_unlisted.SQL")
        self.reject()

    def test_path_traversal(self):
        self.write(self.entry().replace("001_first.sql", "../001_first.sql"))
        self.reject()

    def test_symlink_manifest(self):
        other = self.directory / "other"
        other.write_text(self.entry())
        self.manifest.symlink_to(other)
        self.reject()

    def test_symlink_sql(self):
        self.write(self.entry())
        sql = self.directory / "001_first.sql"
        sql.rename(self.directory / "other")
        sql.symlink_to(self.directory / "other")
        self.reject()

    def test_directory_instead_of_sql(self):
        self.write(self.entry())
        sql = self.directory / "001_first.sql"
        sql.unlink()
        sql.mkdir()
        self.reject()

    def test_cli_failure_emits_no_execution_list(self):
        self.write(self.entry() + "invalid\n")
        result = subprocess.run([sys.executable, str(SCRIPT), str(self.directory)],
                                text=True, capture_output=True)
        self.assertEqual(result.returncode, 78)
        self.assertEqual(result.stdout, "")
        self.assertIn("MIGRATION_MANIFEST_INVALID", result.stderr)

    def test_cli_returns_exact_order(self):
        self.write(self.entry() + self.entry("010_second.sql"))
        result = subprocess.run([sys.executable, str(SCRIPT), str(self.directory)],
                                text=True, capture_output=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout, "001_first.sql\n010_second.sql\n")


if __name__ == "__main__":
    unittest.main()
