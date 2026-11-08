# bettercamsur.ph

Community issue reporting for Camarines Sur. Built with Next.js 16 / Node.js 26, PostgreSQL (`pg` with SQL migrations), Redis, Keycloak OIDC, SMTP, Leaflet/OpenStreetMap, and Ceph RGW (S3-compatible object storage).

## Architecture

- **Web:** Next.js container, stateless and horizontally scalable.
- **PostgreSQL:** source of truth for reports, evidence metadata, departments, provinces, municipalities, invitations, user assignments, access requests, and audit events.
- **Redis:** disposable cache; no authoritative data is stored there.
- **Identity:** Keycloak realm `bettercamsur` for login, OIDC tokens, and government user credentials.
- **SMTP:** invitation, access-request acknowledgement, and report status emails.
- **Evidence:** Ceph RGW S3-compatible bucket.

There is no Prisma dependency. SQL migrations live in `db/migrations` and run automatically when the web container starts. PostgreSQL and Redis are external services; the Docker Compose file starts only the web app.

## Local Docker deployment

Requirements: Docker Engine and Docker Compose, PostgreSQL 16+ reachable from the app container, Redis 7+ reachable from the app container, Keycloak, SMTP, and Ceph RGW.

```bash
cp .env.example .env
# Edit .env with reachable service DNS names, credentials, SMTP and Keycloak settings.
docker compose up -d --build
```

The application listens on port 3000. For a local test, set `APP_BASE_URL=http://localhost:3000`. Do not expose PostgreSQL or Redis publicly. Ensure the database and Redis hostnames resolve from the Docker network.

### PostgreSQL initialization

Create an empty database and application role, then grant schema creation rights for the first migration:

```sql
CREATE ROLE bettercamsur LOGIN PASSWORD 'REPLACE_WITH_LONG_RANDOM_PASSWORD';
CREATE DATABASE bettercamsur OWNER bettercamsur;
```

Set `DATABASE_URL=postgresql://bettercamsur:PASSWORD@YOUR_POSTGRES_HOST:5432/bettercamsur` to a host/IP reachable from the Docker network. The container runs `node scripts/migrate.mjs` before starting Next.js. Migrations are tracked in `schema_migrations`.

### Redis

Set `REDIS_URL`, including password and database number if applicable, for example `redis://:PASSWORD@redis-host:6379/0`. Redis is optional for correctness; PostgreSQL remains the source of truth.

## Keycloak configuration

1. Import `keycloak/bettercamsur-realm.json` into Keycloak (or create an equivalent realm).
2. Configure the `bettercamsur-web` public client with the production callback/origin URLs. The browser client uses Authorization Code Flow with PKCE (S256).
3. Create/configure `bettercamsur-provisioner` as a confidential service-account client. Grant its service account only the required `realm-management` roles: `manage-users`, `view-users`, and `view-realm` (plus role-mapping administration if your Keycloak version requires it).
4. Copy the provisioner client secret into `KEYCLOAK_ADMIN_CLIENT_SECRET`.
5. Configure the realm's SMTP settings in Keycloak if you later enable Keycloak-native email actions. The application SMTP settings below are used for app invitations and notifications.
6. Ensure the realm role names in Keycloak match the role codes in PostgreSQL exactly.

The app validates bearer JWTs against the realm JWKS and issuer. `SYSTEM_ADMIN` is required for centralized invitations, access-request review, and department administration. Create the first System Administrator directly in Keycloak and assign realm role `SYSTEM_ADMIN`. The application automatically creates the corresponding `app_users` record on the first authenticated administrative action; a geographic assignment is not required for this platform-wide role.

## Government account model

- Only `SYSTEM_ADMIN` can create invitations.
- Government personnel can submit an access request. A System Administrator approves or rejects it. Approval creates and emails a one-time invitation.
- Invitation links expire after 48 hours and are single-use. The recipient sets a password; the app creates the Keycloak user and assigns the matching realm role.
- Geographic assignments are hierarchical: a provincial assignment scopes reports to that province; a municipality/city assignment scopes reports to that municipality. Department assignments further restrict report access to that department.
- A municipality assignment must also include its parent province. Component cities and independent/highly urbanized cities are represented distinctly by `municipalities.kind`; populate the correct locality structure for your governance rules.
- Do not grant `SYSTEM_ADMIN` to government users. It is reserved for platform operators.

### Geographic data

Populate `provinces` and `municipalities` with the official administrative geography before issuing government invitations. A Camarines Sur starter seed is provided at `db/seeds/camarines-sur.sql`; review it against current PSA/DILG records before use, then run it with `psql "$DATABASE_URL" -f db/seeds/camarines-sur.sql`. `GET /api/provinces` and `GET /api/municipalities?provinceId=<uuid>` provide lookup data.

## SMTP

Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM`. For STARTTLS on port 587 use `SMTP_SECURE=false`; for implicit TLS on port 465 use `SMTP_SECURE=true`. Use a dedicated sender mailbox and validate SPF, DKIM, and DMARC for the sending domain.

## Ceph RGW evidence storage

Create the `bettercamsur-evidence` bucket and a dedicated RGW user restricted to that bucket. Configure `S3_ENDPOINT`, `S3_PUBLIC_URL`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, and `S3_FORCE_PATH_STYLE=true` for a typical RGW path-style endpoint. Configure CORS to allow browser PUT from the application origin. The upload flow accepts JPEG, PNG, WebP, and HEIC, with a 10 MB per-file and five-file per-report limit.

The starter currently stores a public object URL for evidence display. Before production, use private objects with short-lived signed GET URLs, add malware/content scanning, and apply rate limits/CAPTCHA to public submissions and uploads.

## Kubernetes / Helm deployment

The chart is in `helm/bettercamsur`. It deploys only the stateless web application. PostgreSQL and Redis are external and configured through `database.url` and `redis.url` values (prefer Kubernetes Secrets). The chart supports Service, Ingress, and Gateway API HTTPRoute configuration. Set the image repository/tag to your built image in GHCR or Harbor.

```bash
helm upgrade --install bettercamsur ./helm/bettercamsur \
  --namespace bettercamsur --create-namespace \
  --set image.repository=ghcr.io/ORG/bettercamsur \
  --set image.tag=latest \
  --set existingSecret=bettercamsur-runtime
```

Create `bettercamsur-runtime` with `DATABASE_URL`, `REDIS_URL`, `KEYCLOAK_ADMIN_CLIENT_SECRET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `SMTP_USER`, and `SMTP_PASSWORD`. Configure non-secret environment values in Helm. For production, pin image tags by digest and configure resource requests/limits, network policies, pod disruption budgets, backups, and monitoring.

## Docker image build

```bash
docker build -t bettercamsur.ph:local .
docker run --rm -p 3000:3000 --env-file .env bettercamsur.ph:local
```

## Important production hardening

- The current authorization scope helper limits report APIs by assigned province, municipality, and department. Expand the same scope enforcement to analytics and audit endpoints before giving those views to regional roles.
- Configure Keycloak role mapping, password policy, MFA, account recovery, and session settings.
- The public report and upload endpoints need rate limiting and abuse protection before internet exposure.
- Keep PostgreSQL, Redis, Keycloak admin endpoints, and Ceph RGW management interfaces on trusted networks.
- Back up PostgreSQL and Ceph RGW object data independently; Redis can be rebuilt.
- Ship audit logs to a protected external log system for stronger tamper resistance.

## API overview

| Endpoint | Purpose |
|---|---|
| `POST /api/reports` | Public report submission |
| `GET /api/reports` | Public report feed |
| `PATCH /api/reports/:id` | Authenticated report update within assigned scope |
| `GET /api/track/:reference` | Public report tracking |
| `GET /api/departments` | Public active departments |
| `GET /api/provinces` | Province lookup |
| `GET /api/municipalities?provinceId=` | Municipality/city lookup |
| `GET /api/roles` | Requestable government roles |
| `POST /api/access-requests` | Public government access request |
| `POST /api/admin/invitations` | System-admin invitation creation |
| `GET/PATCH /api/admin/access-requests` | System-admin request review |
| `GET /api/admin/reports` | Reports within authenticated assignment scope |
| `GET /api/admin/audit` | System-admin audit review |
| `POST /api/uploads/presign` | Create Ceph RGW presigned upload |
| `POST /api/uploads/complete` | Verify and register evidence |
| `GET /api/analytics` | Reporting aggregates |


## Optional resident accounts and related problems

Residents can report anonymously. If signed in through Google or Facebook via Keycloak, the submitted report is associated with the resident's Keycloak account and appears at `/account`.

Configure social identity providers in Keycloak Admin Console under **Identity Providers**. Use aliases exactly `google` and `facebook`; the web app uses these aliases for the provider buttons. Store provider client IDs and secrets in Keycloak, not in the Next.js environment. Configure the callback URLs at the social providers:

- `https://sso.mitaka.quest/realms/bettercamsur/broker/google/endpoint`
- `https://sso.mitaka.quest/realms/bettercamsur/broker/facebook/endpoint`

Replace `sso.mitaka.quest` with your Keycloak public hostname if different. Ensure the `bettercamsur-web` client has the production redirect URI and web origin configured.

Residents can edit their own report title, description, and severity only while its status is `SUBMITTED`. The severity choices are LOW, NORMAL, HIGH, and URGENT. Anonymous reports are not automatically attached to a later account; account claiming needs a separate email-verified claim workflow.

Government administrators can create a related-problem record using `POST /api/admin/problems`, then link multiple reports using `POST /api/admin/problems/{problemId}/reports` with `{ "reportId": "<report-uuid>", "action": "LINK" }`. Use `UNLINK` to remove an association. A problem is a shared incident record that groups multiple individual reports.

Apply schema changes before deploying: `npm run db:migrate`.


## Optional resident accounts, severity, and related problems

Residents may submit anonymously. When authenticated with Google or Facebook through Keycloak, reports are associated with their Keycloak account and appear at `/account`. Configure Google and Facebook Identity Providers in Keycloak Admin Console with aliases exactly `google` and `facebook`. Store provider client IDs/secrets in Keycloak, not in the web app. Configure provider callback URLs as `https://sso.mitaka.quest/realms/bettercamsur/broker/google/endpoint` and `https://sso.mitaka.quest/realms/bettercamsur/broker/facebook/endpoint` (adjust the hostname if needed).

Residents can edit their own title, description, and severity while a report is still `SUBMITTED`. Severity choices are LOW, NORMAL, HIGH, and URGENT. Anonymous reports are not automatically claimed by a later account; a separate email-verified claim flow would be needed for that.

Government users can create and manage related-problem groups at `/admin/problems`. Each group can connect multiple reports describing the same underlying issue. Database changes: run `npm run db:migrate` before deploying the new image.


## Resident accounts and related problem groups

Residents can submit reports anonymously. If they choose to sign in with Google or Facebook, Keycloak authenticates them and the report is associated with their Keycloak subject in PostgreSQL. Their dashboard is available at `/account`. Reports submitted anonymously are not automatically attached to a later account; an explicit, verified report-claim flow is required before supporting that.

### Google and Facebook login setup

1. In Google Cloud Console, create an OAuth 2.0 Web client. Add the Keycloak broker callback URL: `https://sso.mitaka.quest/realms/bettercamsur/broker/google/endpoint`.
2. In Meta for Developers, create a Facebook Login app and add the Keycloak broker callback URL: `https://sso.mitaka.quest/realms/bettercamsur/broker/facebook/endpoint`.
3. In Keycloak Admin Console, open realm `bettercamsur` → Identity Providers. Add Google with alias `google` and Facebook with alias `facebook`; enter each provider's client ID and secret in Keycloak.
4. Configure each provider's consent, scopes (`openid`, `email`, `profile` where supported), and email trust/verification policy. Do not assume an unverified social email proves a person's identity.
5. Keep the `bettercamsur-web` client public with Standard Flow, PKCE S256, and exact redirect URIs/web origins for the deployed site. Do not enable Direct Access Grants or implicit flow.

The application buttons use Keycloak identity-provider aliases `google` and `facebook`. Social-provider secrets stay in Keycloak, not in the web app environment.

### Resident report ownership and severity

- Signed-in submissions are associated with `app_users` via `reports.owner_user_id`. Anonymous submissions remain unowned and can be tracked with their reference.
- Residents can view their own reports at `/account` and edit title, description, and severity while status remains `SUBMITTED`. Once acknowledged, edits are locked and government staff manage subsequent changes.
- Severity values: `LOW`, `NORMAL`, `HIGH`, `URGENT`. These are resident-provided assessments; government staff can revise them.

### Related problem groups

Government staff with geographic access can open `/admin/problems`, create a shared problem group, and link or unlink reports within their authorized report scope. Problem groups have a province/municipality scope, and the API verifies report access before association.

Apply migrations with `npm run db:migrate` before deploying the updated application.


## GitHub Actions: build image and publish Helm chart

The workflow `.github/workflows/release.yml`:

- Builds the Next.js production image using the repository `Dockerfile`.
- Publishes `ghcr.io/<github-owner>/bettercamsur` to GitHub Container Registry (GHCR).
- Builds `linux/amd64` images.
- On pull requests, builds the image without publishing it.
- Lints and renders the Helm chart on pull requests.
- Packages and publishes the Helm chart as an OCI artifact to `oci://ghcr.io/<github-owner>/charts`.
- Publishes branch/commit tags for pushes and semantic version tags for Git tags such as `v1.0.0`.

No personal access token is required for the workflow: it uses the repository-scoped `GITHUB_TOKEN` with `packages: write`. After the first successful publication, open the image package settings in GitHub and set package visibility to **Public** if your Kubernetes nodes should pull without an imagePullSecret. If the package remains private, create an image pull secret in the namespace and reference it in `values-homelab.yaml`.

### GitHub repository setup

1. Push this project to a GitHub repository.
2. Ensure Actions are enabled under **Settings → Actions → General**.
3. Under **Settings → Actions → General → Workflow permissions**, allow the workflow to read repository contents. The workflow declares `packages: write` itself.
4. Push to `main` or `master`, or create a release tag such as `v1.0.0`.
5. Check **Actions** for the `Build and publish bettercamsur.ph` workflow.
6. After a successful run, the image is published at `ghcr.io/<github-owner>/bettercamsur` and the chart at `oci://ghcr.io/<github-owner>/charts/bettercamsur`.

### Kubernetes deployment (external PostgreSQL and Redis)

The chart deploys only the web application. PostgreSQL, Redis, Keycloak, SMTP, and Ceph RGW must already be reachable from the Kubernetes namespace. Do not expose PostgreSQL or Redis publicly.

Create the namespace and runtime Secret. Replace every placeholder with the real value; do not commit this Secret to Git:

```bash
kubectl create namespace bettercamsur

kubectl -n bettercamsur create secret generic bettercamsur-runtime \
  --from-literal=DATABASE_URL='postgresql://bettercamsur:REPLACE_ME@postgresql.database.svc:5432/bettercamsur' \
  --from-literal=REDIS_URL='redis://:REPLACE_ME@redis.database.svc:6379/0' \
  --from-literal=KEYCLOAK_ADMIN_CLIENT_SECRET='REPLACE_ME' \
  --from-literal=S3_ACCESS_KEY='REPLACE_ME' \
  --from-literal=S3_SECRET_KEY='REPLACE_ME' \
  --from-literal=SMTP_USER='notifications@bettercamsur.ph' \
  --from-literal=SMTP_PASSWORD='REPLACE_ME'
```

If your PostgreSQL or Redis is outside Kubernetes, use a routable internal DNS name/IP and ensure firewall rules permit traffic from the Kubernetes nodes/pods. Use URL-encode for reserved characters in database credentials.

Update `helm/bettercamsur/values-homelab.yaml`:
- Replace `REPLACE_GITHUB_OWNER` with your lowercase GitHub organization/user.
- Set the correct Gateway API `parentRefs` name and namespace. The sample assumes a Cilium Gateway named `cilium-gateway` in `kube-system`; verify it with `kubectl get gateways.gateway.networking.k8s.io -A`.
- Set the correct Keycloak, SMTP, S3, and public hostnames for your environment.
- Ensure the Gateway listener accepts hostname `bettercamsur.ph` and terminates TLS with a certificate.

Deploy from the repository checkout:

```bash
helm upgrade --install bettercamsur ./helm/bettercamsur \
  --namespace bettercamsur \
  --values ./helm/bettercamsur/values-homelab.yaml \
  --set image.tag=latest

kubectl -n bettercamsur rollout status deployment/bettercamsur-bettercamsur
kubectl -n bettercamsur get pods,svc
kubectl -n bettercamsur logs deployment/bettercamsur-bettercamsur
```

Or install the published OCI chart after logging into GHCR if it is private:

```bash
helm registry login ghcr.io -u YOUR_GITHUB_USERNAME
helm upgrade --install bettercamsur \
  oci://ghcr.io/YOUR_GITHUB_OWNER/charts/bettercamsur \
  --version CHART_VERSION \
  --namespace bettercamsur --create-namespace \
  --values ./helm/bettercamsur/values-homelab.yaml \
  --set image.tag=YOUR_IMAGE_TAG
```

For a private GHCR image, create a Kubernetes pull secret and add it to `imagePullSecrets` in the values file:

```bash
kubectl -n bettercamsur create secret docker-registry ghcr-pull \
  --docker-server=ghcr.io \
  --docker-username=YOUR_GITHUB_USERNAME \
  --docker-password=YOUR_GITHUB_TOKEN
```

```yaml
imagePullSecrets:
  - name: ghcr-pull
```

### Verify deployment

```bash
kubectl -n bettercamsur get deploy,pods,svc,endpoints
kubectl -n bettercamsur describe pod -l app.kubernetes.io/instance=bettercamsur
kubectl -n bettercamsur logs deploy/bettercamsur-bettercamsur --tail=200
kubectl get httproute -n bettercamsur
```

If pods fail:
- `ImagePullBackOff`: verify GHCR package visibility, image name/tag, and `imagePullSecrets`.
- `CrashLoopBackOff`: inspect logs; verify database connectivity and all required runtime Secret keys.
- `HTTPRoute` not accepted: verify the Gateway name/namespace, listener hostname, TLS listener, and Gateway API CRDs.
- `503` from the Gateway: verify the Service endpoints and that the pods pass readiness checks.

The container currently runs SQL migrations before starting Next.js. The migration runner uses a PostgreSQL advisory lock and migration history table to serialize concurrent starts during multi-replica rollout. Test migrations against a PostgreSQL backup or staging database before production upgrades.
