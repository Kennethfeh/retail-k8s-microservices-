# Retail Kubernetes Microservices

Node.js gateway plus two backend services that simulate a retail catalog/fulfillment workflow. The repo shows how I structure microservices for Kubernetes with health probes, Docker images, and GitHub Actions coverage.

## Quick smoke test

```bash
bash -c 'npm --prefix service1 ci && npm --prefix service1 test && \
        npm --prefix service2 ci && npm --prefix service2 test && \
        npm --prefix gateway ci && npm --prefix gateway test && \
        curl -s http://localhost:4000/healthz || true'
```

This installs dependencies, runs unit tests for all services, and finally pings the gateway health endpoint so you know everything compiled before diving into multi-terminal dev flows.

## Architecture

- **Gateway** (`gateway/`) exposes `/api/aggregate`, fans out to the backend services, and reports health via `/healthz`.
- **Inventory service** (`service1/`) returns product availability with timestamps and configurable messages.
- **Fulfillment service** (`service2/`) surfaces build metadata and uptime checks so operators can verify rollouts.
- **Kubernetes manifests** (`k8s/*.yaml`) create Deployments and Services for each component with readiness/liveness probes and resource guardrails.

## Request flow

1. Client hits `GET /api/aggregate` on the gateway.
2. Gateway fans out to `service1` (`/api/service1`) for catalog data and `service2` (`/api/service2`) for fulfillment status.
3. Responses are combined, enriched with build metadata, and returned to the caller.
4. `/healthz` endpoints on every service feed readiness probes and dashboards.

## Repository layout

| Path | Purpose |
| --- | --- |
| `gateway`, `service1`, `service2` | Independent Node.js apps with their own eslint configs, Dockerfiles, and unit tests. |
| `k8s/` | Namespaced manifests for each Deployment/Service pair. Replace the `image:` tags with builds from your registry. |
| `.github/workflows/portfolio.yml` | Retail job installs dependencies per service, runs lint/tests, builds Docker images, and dry-runs `kubectl apply`. |

## Local development

```bash
# terminal 1
(cd service1 && npm install && npm run dev)

# terminal 2
(cd service2 && npm install && npm run dev)

# terminal 3 - point gateway to local services
(cd gateway && npm install && \
  SERVICE1_URL=http://localhost:4001/api/service1 \
  SERVICE2_URL=http://localhost:4002/api/service2 \
  npm run dev)
```

Send traffic through the gateway:

```bash
curl http://localhost:4000/api/aggregate | jq
```

## Container images

Every service has a minimal `node:18-alpine` Dockerfile. Build and tag them for your registry:

```bash
for dir in service1 service2 gateway; do
  docker build -t registry.example.com/retail/$dir:$(git rev-parse --short HEAD) "$dir"
  docker push registry.example.com/retail/$dir:$(git rev-parse --short HEAD)
done
```

## Kubernetes deployment

1. Publish the three container images.
2. Update the `image:` fields inside `k8s/deployment-*.yaml`.
3. Apply the manifests:

```bash
kubectl create namespace retail || true
kubectl apply -n retail -f k8s/
```

Each Deployment defines readiness/liveness probes, memory/CPU requests, and separates services so you can roll them independently.

## Testing and CI

- `npm test` inside each directory uses the Node test runner + Supertest.
- The workflow job `retail_k8s_microservices` installs dependencies per service, runs eslint + unit tests, builds Docker images, and dry-runs `kubectl apply` with `azure/setup-kubectl`.
- Fail-fast loops mean a regression in one service stops the rest of the pipeline, mirroring how I stage multicomponent deploys in production.

## Operations notes

- Override `SERVICE1_URL`/`SERVICE2_URL` so the gateway can speak to prod/staging endpoints without rebuilding the container.
- `service2` reports uptime/commit metadata—wire it to Grafana/Prometheus or your favorite health dashboard.
- Because everything speaks HTTP/JSON, you can slot service meshes or API gateways in front without code changes.
