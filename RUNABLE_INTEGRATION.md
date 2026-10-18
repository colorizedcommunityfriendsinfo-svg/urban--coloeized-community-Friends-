# Runable integration — preparation only

**Status: NOT DEPLOYED. Automatic production deployment is not implemented.**

The intended future deployment integration builds the Urban Colorized Community Friends web and mobile services, publishes their containers to GitHub Container Registry (GHCR), and deploys them on pushes to `main`. The following dependencies must be resolved first.

## Implemented source

On October 18, 2026, the user authorized building the applications from scratch. The repository now includes a complete shared community app, separate `web/` and `mobile/` service targets, reproducible npm manifests/lockfiles, Node 24 multi-stage Dockerfiles, a personal planner, saved activity library, and mobile PWA support.

See [README.md](README.md) for local run, test and container commands. The mobile target is a hosted progressive web app, not a native app-store build. Both services retain Wix as the external store/account system.

## Verification workflow

`.github/workflows/runable-source-readiness.yml` checks source inputs, builds both services, tests data and HTTP behavior, runs Chromium at desktop and phone sizes, and builds/runs both containers on pull requests, pushes to `main`, and manual dispatch. It has read-only repository permissions and uses no deployment secrets. It uploads test screenshots only; it does not publish container images or deploy production services.

Build containers from the **repository root**, using `docker build -f web/Dockerfile .` and `docker build -f mobile/Dockerfile .`. The root `.dockerignore` restricts the build context to required source; do not use `web/` or `mobile/` as the context. Defaults are web port `80` and mobile port `8080`, with `PORT` overrides supported. `/healthz` is the health route.

Local build and data/HTTP results are recorded in the pull request. Use the current PR's GitHub Actions results for container and browser evidence. A green workflow validates these apps; it does not establish Runable API compatibility, Wix entitlements, native-device support or production availability.

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

1. Require the existing application verification workflow to pass before publishing images.
2. Use pinned actions, minimum job permissions, and bounded run time/concurrency.
3. Authenticate GHCR publication with `GITHUB_TOKEN`; independently configure the provider's private-image pull access. Do not make images public as a workaround.
4. Publish separate, lowercase image names tagged with the commit SHA and deploy immutable image digests.
5. Send the verified provider payload with proper JSON encoding, bounded network timeouts, and HTTP error handling without logging credentials or signed URLs.
6. Avoid blind retries of create requests unless documented idempotency exists.
7. Poll documented deployment status and check application health. Request acceptance is not proof that either service is running.
8. Record both deployment results independently and provide recovery if only one service succeeds.

Acceptance requires successful image builds, authenticated provider pulls, successful deployment status and health checks for both services, failure-path verification, and a rollback exercise. Provider deployment, authenticated image pull, production health and rollback tests have not run.

## CCF Academy remains a separate Wix release gate

This repository has not been established as the existing Wix site's connected source repository. A container deployment does not install a Wix web method or supply its trusted member session. Do not copy a Wix API credential into frontend code or substitute a browser-supplied member ID for authentication.

The Academy workbook remains unavailable until its server-side entitlement implementation, approved replacement file, administrator plan allowlist, publication approval, and live access tests are completed. REVIEW_ONLY material must not be included in container images or public source. This integration does not authorize workbook release, domain migration, pricing changes, enrollment changes, or changes to published Wix courses.
