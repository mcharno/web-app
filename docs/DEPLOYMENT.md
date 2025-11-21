# Deployment Guide

This guide covers deploying the web-app to a k3s Kubernetes cluster using GitHub Actions and ArgoCD.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Initial Setup](#initial-setup)
4. [Photo Directory Configuration](#photo-directory-configuration)
5. [GitHub Actions CI/CD](#github-actions-cicd)
6. [ArgoCD Deployment](#argocd-deployment)
7. [Troubleshooting](#troubleshooting)

## Architecture Overview

The application uses a **GitOps** deployment model:

```
GitHub Repo (main branch)
    ↓
GitHub Actions (CI/CD)
    ├── Build & Test (Frontend/Backend)
    ├── Build Docker Images
    ├── Push to ghcr.io
    └── Update Kustomization manifests
        ↓
ArgoCD (watches repo)
    ↓
K3s Cluster
    ├── Frontend (Nginx + React)
    ├── Backend (Node.js + Express)
    └── Photos PVC (Persistent Storage)
```

### Photo Serving Architecture

- **Local Development**: Frontend serves photos directly from `public/images/photos`
- **K8s Production**:
  - Photos stored in PersistentVolume (`photos-pvc`)
  - Backend serves photos from `/data/photos` (mounted from PVC)
  - Frontend proxies `/images/photos/*` requests to backend

## Prerequisites

### Local Machine
- Docker and Docker Compose
- Node.js 20+
- Git
- kubectl configured for your k3s cluster
- argocd CLI (optional, for manual operations)

### K3s Cluster
- k3s installed and running
- ArgoCD installed in the `argocd` namespace
- GitHub Container Registry (GHCR) credentials configured

### GitHub
- Repository access (mcharno/web-app)
- Secrets configured:
  - `GITHUB_TOKEN` (automatically available)

## Initial Setup

### 1. Configure GitHub Container Registry Access

Create a GitHub Personal Access Token (PAT) with `read:packages` and `write:packages` permissions.

On your k3s cluster, create the GHCR secret:

```bash
kubectl create namespace charno-web

kubectl create secret docker-registry ghcr-secret \
  --namespace=charno-web \
  --docker-server=ghcr.io \
  --docker-username=YOUR_GITHUB_USERNAME \
  --docker-password=YOUR_GITHUB_PAT \
  --docker-email=YOUR_EMAIL
```

### 2. Update Kustomization with Your GitHub Username

Edit `infra/k8s/base/kustomization.yaml`:

```yaml
images:
  - name: ghcr.io/GITHUB_USERNAME/charno-backend
    newTag: latest
  - name: ghcr.io/GITHUB_USERNAME/charno-frontend
    newTag: latest
```

Replace `GITHUB_USERNAME` with your actual GitHub username (e.g., `mcharno`).

### 3. Create Kubernetes Secrets

Create a secrets file from the template:

```bash
cp infra/k8s/base/secret-template.yaml infra/k8s/base/secrets.yaml
```

Edit `secrets.yaml` with your actual values (base64 encoded):

```bash
echo -n "your_db_user" | base64
echo -n "your_db_password" | base64
```

**IMPORTANT**: Do NOT commit `secrets.yaml` to git. It's in `.gitignore`.

Apply the secrets:

```bash
kubectl apply -f infra/k8s/base/secrets.yaml
```

## Photo Directory Configuration

### Local Development

The backend automatically serves photos from:
```
PHOTOS_DIR=${PHOTOS_DIR:-../../frontend/public/images/photos}
```

No configuration needed for local development.

### K3s Production Setup

#### Step 1: Create the PersistentVolumeClaim

```bash
kubectl apply -f infra/k8s/base/photos-pvc.yaml
```

This creates a 10Gi PVC using k3s's default `local-path` storage class.

#### Step 2: Find the Volume Path

K3s creates the actual storage directory on your node. Find it:

```bash
# Get the PV name
kubectl get pv -n charno-web

# Describe the PV to find the path
kubectl describe pv <pv-name>
```

The path will typically be something like:
```
/var/lib/rancher/k3s/storage/pvc-<uuid>
```

#### Step 3: Populate Photos

SSH into your k3s node and copy your photos:

```bash
# Example: Copy from your local machine
sudo mkdir -p /var/lib/rancher/k3s/storage/pvc-<uuid>
sudo chown -R 1001:1001 /var/lib/rancher/k3s/storage/pvc-<uuid>

# Copy photos (adjust paths as needed)
sudo rsync -av /path/to/your/photos/ /var/lib/rancher/k3s/storage/pvc-<uuid>/
```

**Note**: The backend runs as user ID 1001, so ensure proper permissions.

#### Directory Structure

Your photos directory should match the structure expected by the gallery JSON files:

```
/data/photos/
├── sample1.jpg
├── sample2.jpg
├── sample3.jpg
└── ...
```

The filenames must match those referenced in your gallery JSON files (`backend/content/en/galleries/*.json`).

## GitHub Actions CI/CD

### Workflow Overview

The CI/CD pipeline (`.github/workflows/ci-cd.yaml`) runs on every push to `main`:

1. **Backend Build**
   - Install dependencies
   - Run linter
   - Run tests with coverage
   - Build Docker image
   - Push to `ghcr.io/mcharno/charno-backend`

2. **Frontend Build**
   - Install dependencies
   - Run linter
   - Run tests with coverage
   - Build application
   - Build Docker image
   - Push to `ghcr.io/mcharno/charno-frontend`

3. **Update Manifests**
   - Update `kustomization.yaml` with new image tags
   - Commit and push changes
   - ArgoCD detects changes and syncs

### Image Tagging Strategy

Images are tagged with:
- `main-<git-sha>`: For main branch commits
- `develop-<git-sha>`: For develop branch commits
- `latest`: Only for main branch

### Triggering Deployments

Simply push to the `main` branch:

```bash
git add .
git commit -m "feat: Add new feature"
git push origin main
```

GitHub Actions will automatically:
1. Build and test
2. Create Docker images
3. Push to GHCR
4. Update k8s manifests
5. ArgoCD syncs within 3 minutes

## ArgoCD Deployment

### Install the ArgoCD Application

Apply the ArgoCD Application manifest:

```bash
kubectl apply -f infra/argocd/application.yaml
```

This configures ArgoCD to:
- Watch the `infra/k8s/base` directory in your repo
- Auto-sync on changes (every 3 minutes)
- Auto-heal (fix drift)
- Auto-prune (remove deleted resources)

### Verify ArgoCD Application

```bash
# Using kubectl
kubectl get applications -n argocd

# Using argocd CLI
argocd app list
argocd app get charno-web
```

### Manual Sync (if needed)

```bash
argocd app sync charno-web
```

### Check Application Health

```bash
argocd app get charno-web
```

Look for:
- **Sync Status**: Synced
- **Health Status**: Healthy

### ArgoCD UI

Access the ArgoCD UI:

```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

Then open: https://localhost:8080

Default credentials:
- Username: `admin`
- Password: Get from `kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d`

## Accessing the Application

### Via Ingress (if configured)

Check your ingress configuration in `infra/k8s/base/ingress.yaml` and access via your configured domain.

### Via Port Forwarding

Frontend:
```bash
kubectl port-forward -n charno-web svc/charno-frontend 8080:8080
```

Backend:
```bash
kubectl port-forward -n charno-web svc/charno-backend 3080:3080
```

## Environment Variables

### Backend (`backend/src/server.js`)

| Variable | Description | Default | Production |
|----------|-------------|---------|------------|
| `NODE_ENV` | Environment | `development` | `production` |
| `PORT` | Server port | `3080` | `3080` |
| `PHOTOS_DIR` | Photos directory | `../../frontend/public/images/photos` | `/data/photos` |
| `DB_HOST` | PostgreSQL host | `localhost` | From ConfigMap |
| `DB_PORT` | PostgreSQL port | `5432` | From ConfigMap |
| `DB_NAME` | Database name | `charno_web` | From ConfigMap |
| `DB_USER` | Database user | - | From Secret |
| `DB_PASSWORD` | Database password | - | From Secret |

### Frontend (Nginx)

The frontend proxies photo requests to the backend service:
```nginx
location /images/photos/ {
    proxy_pass http://charno-backend:3080/images/photos/;
}
```

## Troubleshooting

### Photos Not Loading

1. **Check PVC is bound**:
   ```bash
   kubectl get pvc -n charno-web
   ```

2. **Check backend can access photos**:
   ```bash
   kubectl exec -it -n charno-web deployment/charno-backend -- ls -la /data/photos
   ```

3. **Check backend logs**:
   ```bash
   kubectl logs -n charno-web deployment/charno-backend
   ```

   Should show: `Photos directory: /data/photos`

4. **Test photo serving**:
   ```bash
   kubectl port-forward -n charno-web svc/charno-backend 3080:3080
   curl http://localhost:3080/images/photos/sample1.jpg
   ```

### ArgoCD Not Syncing

1. **Check ArgoCD application status**:
   ```bash
   argocd app get charno-web
   ```

2. **Check for sync errors**:
   ```bash
   kubectl describe application charno-web -n argocd
   ```

3. **Force sync**:
   ```bash
   argocd app sync charno-web --force
   ```

### Image Pull Errors

1. **Verify ghcr-secret exists**:
   ```bash
   kubectl get secret ghcr-secret -n charno-web
   ```

2. **Check image tags match**:
   ```bash
   # In kustomization.yaml
   cat infra/k8s/base/kustomization.yaml

   # In GHCR
   # Visit: https://github.com/mcharno?tab=packages
   ```

3. **Re-create ghcr-secret if needed**:
   ```bash
   kubectl delete secret ghcr-secret -n charno-web
   # Then follow setup steps
   ```

### GitHub Actions Failing

1. **Check workflow runs**:
   Visit: https://github.com/mcharno/web-app/actions

2. **Common issues**:
   - Tests failing: Fix tests locally first
   - Docker build failing: Check Dockerfiles
   - Push permission denied: Verify GITHUB_TOKEN permissions
   - Manifest update failing: Check git permissions

## Monitoring

### Check Pod Status

```bash
kubectl get pods -n charno-web
kubectl describe pod <pod-name> -n charno-web
kubectl logs <pod-name> -n charno-web
```

### Check Services

```bash
kubectl get svc -n charno-web
kubectl describe svc charno-backend -n charno-web
```

### Check Ingress

```bash
kubectl get ingress -n charno-web
kubectl describe ingress charno-ingress -n charno-web
```

## Rollback

### Via ArgoCD

```bash
# View history
argocd app history charno-web

# Rollback to previous version
argocd app rollback charno-web <revision-number>
```

### Via kubectl

```bash
# Rollback deployment
kubectl rollout undo deployment/charno-backend -n charno-web
kubectl rollout undo deployment/charno-frontend -n charno-web

# Check rollout status
kubectl rollout status deployment/charno-backend -n charno-web
```

## Scaling

### Manual Scaling

```bash
# Scale backend
kubectl scale deployment charno-backend -n charno-web --replicas=3

# Scale frontend
kubectl scale deployment charno-frontend -n charno-web --replicas=3
```

### Auto-scaling (HPA)

Create a HorizontalPodAutoscaler:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: charno-backend-hpa
  namespace: charno-web
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: charno-backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## Security

### Secrets Management

- Never commit secrets to git
- Use Kubernetes Secrets for sensitive data
- Consider using sealed-secrets or external-secrets for GitOps-friendly secret management

### Network Policies

Consider adding NetworkPolicies to restrict pod-to-pod communication:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-netpol
  namespace: charno-web
spec:
  podSelector:
    matchLabels:
      app: charno-backend
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: charno-frontend
    ports:
    - protocol: TCP
      port: 3080
```

## Backup

### Photos Backup

```bash
# From k3s node
sudo tar -czf photos-backup-$(date +%Y%m%d).tar.gz /var/lib/rancher/k3s/storage/pvc-<uuid>
```

### Database Backup (if using PostgreSQL)

```bash
kubectl exec -it -n charno-web deployment/charno-postgres -- pg_dump -U charno_user charno_web > backup.sql
```

## Useful Commands

```bash
# Watch all resources
kubectl get all -n charno-web

# Get full resource details
kubectl get all -n charno-web -o wide

# Stream logs
kubectl logs -f -n charno-web deployment/charno-backend

# Execute commands in pod
kubectl exec -it -n charno-web deployment/charno-backend -- /bin/sh

# Check resource usage
kubectl top pods -n charno-web
kubectl top nodes

# View ArgoCD sync status
watch -n 2 'argocd app get charno-web | grep -E "Sync Status|Health Status"'
```

## Next Steps

1. **Set up monitoring**: Consider Prometheus + Grafana
2. **Set up logging**: Consider Loki or ELK stack
3. **Set up alerts**: Configure alerting for critical issues
4. **Set up backups**: Automate photo and database backups
5. **Configure SSL/TLS**: Set up cert-manager for HTTPS
6. **Optimize images**: Reduce Docker image sizes
7. **Add health checks**: Enhance liveness/readiness probes

## Support

For issues or questions:
1. Check GitHub Actions logs
2. Check ArgoCD UI
3. Check pod logs
4. Review this documentation
5. Check Kubernetes events: `kubectl get events -n charno-web --sort-by='.lastTimestamp'`
