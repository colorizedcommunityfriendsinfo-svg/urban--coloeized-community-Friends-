# Colorized Community Friends

A community hub and mobile PWA built from scratch for CCF. Both services share the same accessible, responsive interface and use the existing Wix site for commerce and accounts.

## Included

- Original community homepage and geometric artwork.
- Six self-guided activities with text search, category filters, activity details and saved favorites.
- A personal planner with add, complete, delete, persistent local storage and JSON export.
- A mobile app manifest, home-screen icons and offline public app shell.
- Guardian Academy coming-soon page. No enrollment, payment collection or workbook download.
- Two Node 24 container targets, health endpoints, security headers and read-only, non-root runtime support.
- Automated data/HTTP, desktop/mobile browser, offline and container smoke checks.

The mobile target is an **installable progressive web app**, not a native iOS/Android binary. Favorites and plans stay in the current browser and do not sync between devices, domains or the two service origins. No analytics, third-party scripts, login simulation or runtime npm dependencies are included.

## Run locally

Requires Node 24 and npm. From the repository root:

```bash
npm --prefix web ci
npm --prefix mobile ci
npm run build
PORT=3000 npm --prefix web start
# In a separate terminal:
PORT=8080 npm --prefix mobile run start:mobile
```

Open `http://localhost:3000` or `http://localhost:8080`. Use HTTPS in production; localhost supports the PWA during development. The service defaults are web port 80 and mobile port 8080. `PORT` can override either.

## Verify

```bash
python3 scripts/check-runable-source.py
npm run build
npm test
npm ci
npx playwright install --with-deps --only-shell chromium
npm run test:browser
```

Browser tests cover 1440px desktop and 390px phone layouts, search, saving, dialogs, planner persistence, safe rendering of user text, JSON export, deletion, offline use and the disabled workbook boundary. Screenshots are written to `artifacts/` and retained as a CI artifact. This is not a substitute for a full accessibility audit or physical iOS/Android device testing.

## Containers

**Use the repository root as the build context**, because both services use `shared/` and `scripts/build.mjs`:

```bash
docker build -f web/Dockerfile -t ccf-web .
docker build -f mobile/Dockerfile -t ccf-mobile .
docker run --rm --read-only --cap-drop ALL --security-opt no-new-privileges -p 3000:80 ccf-web
docker run --rm --read-only --cap-drop ALL --security-opt no-new-privileges -p 8080:8080 ccf-mobile
```

`GET /healthz` reports service health and `workbookReleaseEnabled: false`. The web image uses port 80 with Docker's normal unprivileged-port setting; on a runtime restricting low ports, set `PORT=8080` and update the mapping and provider port. Both images run as `node` and need no persistent server filesystem. Provider ingress must supply TLS.

## Architecture

| Path | Purpose |
| --- | --- |
| `shared/` | Public UI, activity data, original SVG art, local state validation and HTTP server |
| `web/`, `mobile/` | Service manifests, lockfiles and Dockerfiles |
| `scripts/build.mjs` | Produces each public `dist/`, PNG icons, manifest and versioned service worker |
| `tests/` | Data/HTTP and real-browser checks |
| `.github/workflows/runable-source-readiness.yml` | Build, tests and container checks; no deployment |
| `digital-clock/` | Existing standalone demo, preserved |

The server loads a fixed set of build-produced files into memory. Requests cannot select filesystem paths. Public assets revalidate; API and error responses use `Cache-Control: no-store`. The service worker caches only explicitly listed same-origin public shell assets, excluding all API requests, query URLs and Wix pages.

## Academy security boundary

Every `/api/workbook` request returns HTTP 403, including authenticated-looking requests and caller-supplied member/file IDs. There is no switch that enables downloads. The companion contains no Wix credentials, private PDF, signed URL or elevated media call.

This denial boundary is **not the requested Wix entitlement implementation**. Live access still requires the actual Wix backend, trusted current-member identity, verified allowed plan orders, administrator approval of the course and replacement workbook, rate limits, minimal auditing and the complete A–J live test matrix. None of those live Wix checks is established by these companion tests.

## Deployment status

See [RUNABLE_INTEGRATION.md](RUNABLE_INTEGRATION.md). Source is now implemented; automatic Runable deployment remains unconfigured pending its verified deployment contract. No changes to the Wix domain, store prices, memberships, enrollments or published courses are made by this repository.
