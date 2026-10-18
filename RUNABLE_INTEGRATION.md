# Runable integration — preparation only

**Status: NOT DEPLOYED. Automatic production deployment is not implemented.**

The intended integration builds the Urban Colorized Community Friends web and mobile services, publishes their containers to GitHub Container Registry (GHCR), and deploys them on pushes to `main`. The following dependencies must be resolved first.

## Verified repository state

Inspected October 18, 2026 UTC (October 17 Pacific), at commit `e61a72c36cd94b963d54d549c5e222c987d44538`:

- The repository contains documentation and a standalone `digital-clock/` demo.
- There is no `web/` or `mobile/` application, package manifest, lockfile, Dockerfile, or deployment workflow at that commit.
- The clock demo is plain HTML/CSS/JavaScript. It does not supply the two proposed Node applications or the Wix site backend.
- Repository access is available. Runable account configuration, credentials, registry access, deployment capability, and application health are unverified.

This change adds a **source-readiness** workflow, not a deployment workflow.

## Run the source check

```bash
python3 scripts/check-runable-source.py
```

The check reads files without installing dependencies or executing app scripts. It exits `1` when required source inputs are absent or invalid, and `0` when those inputs are present. A zero exit code does **not** establish build success, API compatibility, or approval to deploy.

`.github/workflows/runable-source-readiness.yml` runs this check on pull requests, pushes to `main`, and manual dispatch. It has read-only repository permissions, uses no secrets, and does not build, upload, or deploy anything. Until the app source is supplied, the expected result is **BLOCKED** with the missing paths.

## Supply and inspect the actual applications

For the proposed npm layout, each service needs:

| Path | Required content |
| --- | --- |
| `web/package.json` | Actual dependencies and nonempty `build` / `start` scripts |
| `web/package-lock.json` | Committed npm lockfile matching the app |
| `web/Dockerfile` | Container definition designed for that app |
| `web/.dockerignore` | Exclude credentials, dependency folders, and irrelevant files |
| `mobile/package.json` | Actual dependencies and `build:mobile` / `start:mobile` scripts |
| `mobile/package-lock.json` | Committed npm lockfile matching the app |
| `mobile/Dockerfile` | Container definition for a supported server or web target |
| `mobile/.dockerignore` | Appropriate build-context exclusions |

If the real applications use another package manager or different paths, update the check to match them. Do not invent placeholder scripts to satisfy the check. Establish whether “mobile” means a hosted web app/backend or a native mobile build; an HTTP container is not an iOS or Android app distribution mechanism.

Derive Dockerfiles from the actual framework, build output, runtime dependencies, and listener configuration. Use a compatible supported Node LTS version: the original `node:18-alpine` example is EOL according to the [Node release table](https://nodejs.org/en/about/previous-releases). Use reproducible dependency installation, such as `npm ci` with a validated lockfile. Check the actual bind address and port; `EXPOSE` alone does not configure an application's listener. Validate the proposed web port `80` and mobile port `8080` with container health checks before selecting them for deployment.

## Verify Runable's deployment contract

The previously supplied proposal named:

```text
POST https://api.runable.com/deployments
Authorization: Bearer <RUNABLE_API_KEY>
```

It proposed `name`, `image`, `service_type`, `environment`, and `port` fields. **No authoritative documentation for this endpoint, authentication scheme, or payload was established during this review. No request with credentials was sent. Do not treat this proposal as a verified API contract.**

Runable's public [project import instructions](https://runable.com/import) describe uploading a ZIP and rebuilding onto its managed stack, including replacement of platform-specific services. That is a different process from pulling two GHCR images. An import has not been requested or performed here.

Obtain the provider's documentation or account-specific API specification for:

1. Container deployment availability, endpoint, request schema, supported service types, and create-versus-update semantics.
2. Credential issuance and least-privilege scopes.
3. Private GHCR image authentication, architectures, port binding, health checks, and environment/secret configuration.
4. Response schema, deployment identifier, status polling, terminal failure, rollback, idempotency, rate limits, and timeout behavior.

Then configure `RUNABLE_API_KEY` directly in GitHub Actions secrets if the verified API requires it. Do not paste a key into chat, source, a Docker build argument, or a workflow log. This review did not inspect or change secrets.

## Implement production automation after resolving those dependencies

The planned `.github/workflows/runable-deploy.yml` should:

1. Build and test the real applications before publishing images.
2. Use pinned actions, minimum job permissions, and bounded run time/concurrency.
3. Authenticate GHCR publication with `GITHUB_TOKEN`; independently configure the provider's private-image pull access. Do not make images public as a workaround.
4. Publish separate, lowercase image names tagged with the commit SHA and deploy immutable image digests.
5. Send the verified provider payload with proper JSON encoding, bounded network timeouts, and HTTP error handling without logging credentials or signed URLs.
6. Avoid blind retries of create requests unless documented idempotency exists.
7. Poll documented deployment status and check application health. Request acceptance is not proof that either service is running.
8. Record both deployment results independently and provide recovery if only one service succeeds.

Acceptance requires successful image builds, authenticated provider pulls, successful deployment status and health checks for both services, failure-path verification, and a rollback exercise. None has been run yet.

## CCF Academy remains a separate Wix release gate

This repository has not been established as the existing Wix site's connected source repository. A container deployment does not install a Wix web method or supply its trusted member session. Do not copy a Wix API credential into frontend code or substitute a browser-supplied member ID for authentication.

The Academy workbook remains unavailable until its server-side entitlement implementation, approved replacement file, administrator plan allowlist, publication approval, and live access tests are completed. REVIEW_ONLY material must not be included in container images or public source. This integration does not authorize workbook release, domain migration, pricing changes, enrollment changes, or changes to published Wix courses.
