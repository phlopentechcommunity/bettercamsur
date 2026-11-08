# bettercamsur.ph — Kubernetes homelab deployment

This deployment targets the existing cluster and uses:

- Namespace: `bettercamsur`
- Ingress: Emissary Ingress `Mapping` CRD
- Public ingress path: Cloudflare Tunnel -> Emissary -> bettercamsur Service
- MetalLB: retain the existing Emissary LoadBalancer Service for LAN access if desired
- ExternalDNS: do not create a competing DNS record for the hostname managed by Cloudflare Tunnel
- cert-manager / trust-manager: use for internal TLS or other cluster services; Cloudflare Tunnel can connect to Emissary over HTTP inside the cluster
- PostgreSQL: Bitnami chart `18.12.18`
- Redis: Bitnami chart `28.3.12`
- StorageClass: `ceph-rbd-infra-k8s` (change if the actual name differs)

The application chart does not install PostgreSQL or Redis. They are separate Helm releases in the same namespace.

## 0. Verify the cluster resources

```bash
kubectl get nodes
kubectl get pods -A | grep -Ei 'emissary|ambassador|cloudflared'
kubectl get svc -A | grep -Ei 'emissary|ambassador'
kubectl get crd mappings.getambassador.io
kubectl get storageclass
```

If the Mapping CRD is not present, check the Emissary installation before installing the application:

```bash
kubectl get crd | grep getambassador.io
```

The chart creates a `getambassador.io/v3alpha1` `Mapping`. It intentionally does not create an HTTPRoute or Kubernetes Ingress.

## 1. Create the namespace and credentials

```bash
kubectl create namespace bettercamsur --dry-run=client -o yaml | kubectl apply -f -
```

Create the PostgreSQL and Redis secrets before installing their charts. Use strong, unique passwords and do not commit these secrets to Git.

```bash
kubectl -n bettercamsur create secret generic bettercamsur-postgresql \
  --from-literal=postgres-password='REPLACE_WITH_STRONG_POSTGRES_ADMIN_PASSWORD' \
  --from-literal=password='REPLACE_WITH_STRONG_APP_DATABASE_PASSWORD'
```

```bash
kubectl -n bettercamsur create secret generic bettercamsur-redis \
  --from-literal=redis-password='REPLACE_WITH_STRONG_REDIS_PASSWORD'
```

## 2. Install PostgreSQL

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

helm upgrade --install bettercamsur-postgresql bitnami/postgresql \
  --version 18.12.18 \
  --namespace bettercamsur \
  --values deploy/helm-values/postgresql-values.yaml
```

Wait for it:

```bash
kubectl -n bettercamsur rollout status statefulset/bettercamsur-postgresql
kubectl -n bettercamsur get pods,pvc,svc
```

Expected service DNS:

```text
bettercamsur-postgresql.bettercamsur.svc.cluster.local:5432
```

## 3. Install Redis

```bash
helm upgrade --install bettercamsur-redis bitnami/redis \
  --version 28.3.12 \
  --namespace bettercamsur \
  --values deploy/helm-values/redis-values.yaml
```

Wait for it:

```bash
kubectl -n bettercamsur get pods,pvc,svc
kubectl -n bettercamsur get secret bettercamsur-redis
```

Expected standalone Redis master service DNS:

```text
bettercamsur-redis-master.bettercamsur.svc.cluster.local:6379
```

## 4. Create application runtime Secret

The app chart reads these keys from `bettercamsur-runtime`:

```bash
kubectl -n bettercamsur create secret generic bettercamsur-runtime \
  --from-literal=DATABASE_URL='postgresql://bettercamsur:APP_DATABASE_PASSWORD@bettercamsur-postgresql.bettercamsur.svc.cluster.local:5432/bettercamsur' \
  --from-literal=REDIS_URL='redis://:REDIS_PASSWORD@bettercamsur-redis-master.bettercamsur.svc.cluster.local:6379/0' \
  --from-literal=KEYCLOAK_ADMIN_CLIENT_SECRET='REPLACE_ME' \
  --from-literal=S3_ACCESS_KEY='REPLACE_ME' \
  --from-literal=S3_SECRET_KEY='REPLACE_ME' \
  --from-literal=SMTP_USER='REPLACE_ME' \
  --from-literal=SMTP_PASSWORD='REPLACE_ME'
```

Replace the passwords in the connection URLs with the exact passwords used in steps 2 and 3. URL-encode reserved characters in passwords. For a production setup, use External Secrets, Sealed Secrets, or SOPS rather than committing plaintext credentials.

## 5. Configure the application Helm values

Edit `helm/bettercamsur/values-homelab.yaml`:

- Set `image.repository` to `ghcr.io/<your-github-owner>/bettercamsur`.
- Keep `service.type: ClusterIP`.
- Keep `gateway.enabled: false`.
- Keep `ingress.enabled: false`.
- Keep `emissary.enabled: true`.
- Verify `KEYCLOAK_URL`, S3 endpoint, public evidence URL, SMTP host, and `APP_BASE_URL`.
- Ensure `existingSecret: bettercamsur-runtime`.

The Mapping service target is rendered as:

```text
bettercamsur-bettercamsur.bettercamsur.svc.cluster.local:3000
```

That is the default service name for Helm release `bettercamsur` and chart `bettercamsur`.

## 6. Install the application chart

After the GitHub Actions workflow has published the image:

```bash
helm upgrade --install bettercamsur ./helm/bettercamsur \
  --namespace bettercamsur \
  --values ./helm/bettercamsur/values-homelab.yaml \
  --set image.tag=latest
```

Check:

```bash
kubectl -n bettercamsur get deploy,pods,svc
kubectl -n bettercamsur get mappings.getambassador.io
kubectl -n bettercamsur describe mapping bettercamsur-bettercamsur
kubectl -n bettercamsur rollout status deployment/bettercamsur-bettercamsur
```

## 7. Connect Cloudflare Tunnel to Emissary

First inspect the actual Emissary service name and namespace:

```bash
kubectl get svc -A | grep -Ei 'emissary|ambassador'
```

In the Cloudflare Tunnel public hostname configuration, route:

- Hostname: `bettercamsur.ph`
- Service: `http://<EMISSARY_SERVICE>.<EMISSARY_NAMESPACE>.svc.cluster.local:80`

Use the real Service name and namespace from the previous command. Do not guess them. If the Emissary Service exposes port 8080 instead of 80, use the service's actual HTTP service port.

Cloudflare Tunnel should route to Emissary, not directly to the bettercamsur ClusterIP Service, because Emissary needs to evaluate the `Mapping` hostname and prefix.

If Cloudflare Tunnel runs outside Kubernetes, use the reachable internal LoadBalancer IP or internal DNS name of the Emissary service instead.

Cloudflare Tunnel normally manages the public DNS record for its hostname. Avoid configuring ExternalDNS to publish a second conflicting A/AAAA record for `bettercamsur.ph`.

## 8. Optional MetalLB LAN access

The app Service remains `ClusterIP`. MetalLB should expose the Emissary Ingress Service, not the application Service.

Inspect Emissary's current service:

```bash
kubectl get svc -A | grep -Ei 'emissary|ambassador'
kubectl describe svc -n <EMISSARY_NAMESPACE> <EMISSARY_SERVICE>
```

If the Emissary Service is already `LoadBalancer` with a MetalLB address, no additional LoadBalancer service is needed for bettercamsur.

## 9. Verify and troubleshoot

```bash
kubectl -n bettercamsur get pods -o wide
kubectl -n bettercamsur logs deploy/bettercamsur-bettercamsur --tail=200
kubectl -n bettercamsur get endpoints bettercamsur-bettercamsur
kubectl -n bettercamsur get mappings.getambassador.io
```

From an in-cluster test pod, test the application Service:

```bash
kubectl -n bettercamsur run curl-test --rm -it \
  --image=curlimages/curl --restart=Never -- \
  curl -sv http://bettercamsur-bettercamsur:3000/
```

Test the Emissary hostname route from inside the cluster (replace the service FQDN if needed):

```bash
curl -sv -H 'Host: bettercamsur.ph' \
  http://<EMISSARY_SERVICE>.<EMISSARY_NAMESPACE>.svc.cluster.local:80/
```

Common causes:

- `ImagePullBackOff`: verify GHCR image name/tag and package visibility or configure `imagePullSecrets`.
- `CrashLoopBackOff`: inspect logs and verify runtime Secret keys, PostgreSQL, Redis, SMTP, Keycloak, and Ceph RGW reachability.
- Mapping not found: verify `mappings.getambassador.io` CRD exists and Emissary watches the application's namespace.
- Emissary 404: check the Mapping hostname, prefix, service DNS name, and Emissary logs.
- Cloudflare 502: check Cloudflared can resolve and reach the Emissary Service and correct HTTP port.
- PVC Pending: confirm `ceph-rbd-infra-k8s` exists and Ceph CSI is healthy.

## 10. Database backups

Before application upgrades, take PostgreSQL backups and verify Ceph PVC snapshots/backup policies. Do not treat a Ceph replicated PVC as a database backup.
