# Quick Start Guide

Get your Charno Web application deployed to k3s in under 10 minutes!

## Prerequisites

- k3s cluster running
- kubectl configured
- GitHub repository
- GitHub Personal Access Token (PAT) with `read:packages` scope

## 5-Step Deployment

### 1. Install ArgoCD (2 minutes)

```bash
./argocd/install-argocd.sh
```

Save the admin password shown in the output.

### 2. Configure Secrets (2 minutes)

```bash
# GitHub Container Registry access
./argocd/setup-ghcr-secret.sh
# Enter: GitHub username + PAT

# Database credentials
./argocd/setup-database-secret.sh
# Enter: Database username + password
```

### 3. Update Configuration (2 minutes)

Update your GitHub username in these files:

**`argocd/application.yaml`:**
```yaml
repoURL: https://github.com/YOUR_USERNAME/web-app.git
```

**`k8s/base/backend-deployment.yaml`:**
```yaml
image: ghcr.io/YOUR_USERNAME/charno-backend:latest
```

**`k8s/base/frontend-deployment.yaml`:**
```yaml
image: ghcr.io/YOUR_USERNAME/charno-frontend:latest
```

**`k8s/base/ingress.yaml`:**
```yaml
host: charno.yourdomain.com  # or use your k3s server IP
```

### 4. Deploy to ArgoCD (1 minute)

```bash
./argocd/deploy-application.sh
```

### 5. Push to GitHub (1 minute)

```bash
git add .
git commit -m "Add CI/CD pipeline"
git push origin main
```

## Verify Deployment

```bash
# Watch pods start up
watch kubectl get pods -n charno-web

# Check ArgoCD sync status
kubectl get application charno-web -n argocd
```

## Access Your App

### Port Forward (Quick Test)
```bash
kubectl port-forward svc/charno-frontend -n charno-web 3000:8080
# Visit: http://localhost:3000
```

### Via Domain (Production)
```
https://charno.yourdomain.com
```

## Initialize Database

```bash
# Wait for postgres to be ready
kubectl wait --for=condition=Ready pod -l app=postgres -n charno-web --timeout=300s

# Copy and run schema
POSTGRES_POD=$(kubectl get pod -l app=postgres -n charno-web -o jsonpath='{.items[0].metadata.name}')
kubectl cp backend/src/config/schema.sql charno-web/$POSTGRES_POD:/tmp/schema.sql
kubectl cp backend/src/config/seed.sql charno-web/$POSTGRES_POD:/tmp/seed.sql
kubectl exec -n charno-web $POSTGRES_POD -- psql -U charno_user -d charno_web -f /tmp/schema.sql
kubectl exec -n charno-web $POSTGRES_POD -- psql -U charno_user -d charno_web -f /tmp/seed.sql
```

## How It Works

1. **You push code** → GitHub
2. **GitHub Actions** → Builds Docker images → Pushes to GHCR → Updates k8s manifests
3. **ArgoCD** → Detects changes → Deploys to k3s
4. **Done!** Your app is live

## Next Steps

- Access ArgoCD UI: `kubectl port-forward svc/argocd-server -n argocd 8080:443`
- View logs: `kubectl logs -f deployment/charno-backend -n charno-web`
- Scale: Edit replica count in `k8s/base/*-deployment.yaml` and push
- Monitor: Check GitHub Actions tab for build status

## Troubleshooting

**Pods not starting?**
```bash
kubectl describe pods -n charno-web
kubectl logs -f deployment/charno-backend -n charno-web
```

**Images not pulling?**
```bash
kubectl get secret ghcr-secret -n charno-web
# If missing, run: ./argocd/setup-ghcr-secret.sh
```

**ArgoCD not syncing?**
```bash
kubectl describe application charno-web -n argocd
```

For detailed documentation, see [DEPLOYMENT.md](./DEPLOYMENT.md)
