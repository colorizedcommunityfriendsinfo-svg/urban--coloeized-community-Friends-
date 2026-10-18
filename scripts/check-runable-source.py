#!/usr/bin/env python3
"""Check proposed npm service inputs only; never build, execute, or deploy."""

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SERVICES = {"web": ("build", "start"), "mobile": ("build:mobile", "start:mobile")}


def check_source():
    problems = []
    for service, required_scripts in SERVICES.items():
        for filename in ("package.json", "package-lock.json", "Dockerfile", ".dockerignore"):
            relative = Path(service) / filename
            path = ROOT / relative
            if path.is_symlink() or (ROOT / service).is_symlink():
                problems.append(f"{relative}: expected a regular repository file")
                continue
            if not path.is_file():
                problems.append(f"{relative}: missing")
                continue
            try:
                contents = path.read_text(encoding="utf-8")
                if not contents.strip():
                    problems.append(f"{relative}: empty")
                    continue
                if filename not in ("package.json", "package-lock.json"):
                    continue
                data = json.loads(contents)
                if not isinstance(data, dict):
                    problems.append(f"{relative}: expected a JSON object")
                    continue
                if filename == "package.json":
                    scripts = data.get("scripts")
                    if not isinstance(scripts, dict):
                        scripts = {}
                    for name in required_scripts:
                        value = scripts.get(name)
                        if not isinstance(value, str) or not value.strip():
                            problems.append(f"{relative}: missing nonempty script {name!r}")
                else:
                    version = data.get("lockfileVersion")
                    if type(version) is not int or version not in (1, 2, 3):
                        problems.append(f"{relative}: unsupported or missing lockfileVersion")
            except (OSError, UnicodeError, json.JSONDecodeError):
                problems.append(f"{relative}: unreadable text or invalid JSON")
    return problems


if __name__ == "__main__":
    errors = check_source()
    if errors:
        print("BLOCKED: required application source inputs are incomplete.")
        for error in errors:
            print(f"- {error}")
    else:
        print("Source inputs present. Build, runtime, and provider validation still required.")
    print("No packages installed, scripts executed, images published, or deployments requested.")
    raise SystemExit(1 if errors else 0)
