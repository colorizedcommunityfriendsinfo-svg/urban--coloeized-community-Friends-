#!/usr/bin/env python3
"""Validate migration inventory and bytes; this does not certify a SQL audit."""
import hashlib
from pathlib import Path
import re
import sys


ENTRY = re.compile(r"([a-f0-9]{64})  ([0-9]{3}_[a-z0-9_]+\.sql)")


def validate(directory):
    directory = Path(directory)
    if directory.is_symlink() or not directory.is_dir():
        raise ValueError("migration directory must be a real directory")
    manifest = directory / "SHA256SUMS"
    if manifest.is_symlink() or not manifest.is_file():
        raise ValueError("SHA256SUMS must be a regular, non-symlink file")
    raw = manifest.read_bytes()
    if not raw or not raw.endswith(b"\n"):
        raise ValueError("SHA256SUMS must be nonempty and end with LF")
    entries = raw.decode("ascii").split("\n")[:-1]
    names = []
    previous = -1
    for number, line in enumerate(entries, 1):
        match = ENTRY.fullmatch(line)
        if not match:
            raise ValueError(f"invalid manifest entry on line {number}")
        digest, name = match.groups()
        sequence = int(name[:3])
        if sequence <= previous:
            raise ValueError("migration numbers must be unique and strictly increasing")
        previous = sequence
        path = directory / name
        if path.is_symlink() or not path.is_file():
            raise ValueError(f"migration must be a regular, non-symlink file: {name}")
        content = path.read_bytes()
        if not content.strip():
            raise ValueError(f"empty migration: {name}")
        if hashlib.sha256(content).hexdigest() != digest:
            raise ValueError(f"SHA-256 mismatch: {name}")
        names.append(name)
    sql_entries = {p.name for p in directory.iterdir() if p.suffix.lower() == ".sql"}
    if sql_entries != set(names):
        raise ValueError("every top-level SQL file must appear exactly once in SHA256SUMS")
    return names


def main():
    if len(sys.argv) != 2:
        print("usage: validate-guardian-prime-migrations.py DIRECTORY", file=sys.stderr)
        return 64
    try:
        names = validate(sys.argv[1])
    except (OSError, UnicodeError, ValueError) as error:
        print(f"MIGRATION_MANIFEST_INVALID: {error}", file=sys.stderr)
        return 78
    # Emit the exact execution order only after validating the entire inventory.
    print("\n".join(names))
    return 0


if __name__ == "__main__":
    sys.exit(main())
