# Deployment Guide: Charno Web on k3s with GitHub Actions + ArgoCD

This guide walks you through deploying the Charno Web application to your personal k3s server using a GitOps workflow with GitHub Actions and ArgoCD.

## Architecture Overview

```
┌─────────────┐
│   GitHub    │
│  Repository │
└──────┬──────┘
       │
       │ (push to main)
       ▼
┌─────────────────┐
│ GitHub Actions  │
│   - Build       │
│   - Test        │
│   - Push to GHCR│
│   - Update tags │
└──────┬──────────┘
       │
       │ (commit image tags)
       ▼
┌─────────────┐         ┌──────────────┐
│   GitHub    │────────▶│    ArgoCD    │
│  Repository │         │ (in k3s)     │
└─────────────┘         └──────┬───────┘
                               │
                               │ (auto-sync)
                               ▼
                        ┌──────────────┐
                        │  k3s Cluster │
                        │  - Backend   │
                        │  - Frontend  │
                        │  - PostgreSQL│
                        └──────────────┘
```

## Prerequisites

### 1. k3s Cluster
Ensure you have a k3s cluster running:
```bash
# If not installed, install k3s:
curl -sfL https://get.k3s.io | sh -

# Verify k3s is running:
kubectl get nodes
```

### 2. kubectl Access
Copy your k3s kubeconfig to access the cluster remotely (if deploying from another machine):
```bash
# On k3s server:
sudo cat /etc/rancher/k3s/k3s.yaml

# Copy the content and save locally as ~/.kube/config
# Replace 127.0.0.1 with your k3s server IP address
```

### 3. GitHub Personal Access Token (PAT)
Create a PAT with the following scopes:
- `read:packages` - To pull images from GHCR
- `write:packages` - To push images to GHCR (automatically granted to GitHub Actions)

**Create PAT:**
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token (classic)
3. Select scopes: `read:packages`, `write:packages`
4. Save the token securely

## Installation Steps

### Step 1: Install ArgoCD on k3s

```bash
# Clone your repository
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO

# Install ArgoCD
./argocd/install-argocd.sh
```

This will:
- Create the `argocd` namespace
- Install ArgoCD components
- Display the initial admin password

**Access ArgoCD UI:**
```bash
# Option 1: Port forward (temporary)
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Then visit: https://localhost:8080
# Username: admin
# Password: (from installation output)
```

**Change admin password:**
```bash
# Install ArgoCD CLI (optional but recommended)
curl -sSL -o /usr/local/bin/argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
chmod +x /usr/local/bin/argocd

# Login and change password
argocd login localhost:8080
argocd account update-password
```

### Step 2: Set Up GitHub Container Registry Pull Secret

```bash
# Run the setup script
./argocd/setup-ghcr-secret.sh

# When prompted, enter:
# - Your GitHub username
# - Your GitHub Personal Access Token (with read:packages scope)
```

### Step 3: Set Up Database Secrets

```bash
# Run the setup script
./argocd/setup-database-secret.sh

# When prompted, enter:
# - Database username (default: charno_user)
# - Database password (choose a strong password)
```

### Step 4: Update Configuration Files

#### 4.1 Update GitHub Actions Workflow

The workflow is already configured to use your GitHub username automatically. No changes needed!

#### 4.2 Update Kubernetes Manifests

Edit `k8s/base/backend-deployment.yaml` and `k8s/base/frontend-deployment.yaml`:

Replace `GITHUB_USERNAME` with your actual GitHub username:
```yaml
image: ghcr.io/YOUR_GITHUB_USERNAME/charno-backend:latest
```

#### 4.3 Update ArgoCD Application

Edit `argocd/application.yaml`:
```yaml
source:
  repoURL: https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME.git
```

#### 4.4 Update Ingress (Optional)

Edit `k8s/base/ingress.yaml` and replace with your domain:
```yaml
rules:
  - host: charno.yourdomain.com  # Your domain
```

If you want to enable TLS with cert-manager, uncomment the TLS section.

### Step 5: Configure Database

The manifests include a PostgreSQL deployment for development. For production, you have options:

**Option A: Use included PostgreSQL (Development/Testing)**

The database will be automatically deployed by ArgoCD. You'll need to initialize it:

```bash
# Wait for PostgreSQL to be ready
kubectl wait --for=condition=Ready pod -l app=postgres -n charno-web --timeout=300s

# Copy schema and seed files
kubectl cp backend/src/config/schema.sql charno-web/$(kubectl get pod -l app=postgres -n charno-web -o jsonpath='{.items[0].metadata.name}'):/tmp/schema.sql
kubectl cp backend/src/config/seed.sql charno-web/$(kubectl get pod -l app=postgres -n charno-web -o jsonpath='{.items[0].metadata.name}'):/tmp/seed.sql

# Execute the SQL files
kubectl exec -n charno-web $(kubectl get pod -l app=postgres -n charno-web -o jsonpath='{.items[0].metadata.name}') -- psql -U charno_user -d charno_web -f /tmp/schema.sql
kubectl exec -n charno-web $(kubectl get pod -l app=postgres -n charno-web -o jsonpath='{.items[0].metadata.name}') -- psql -U charno_user -d charno_web -f /tmp/seed.sql
```

**Option B: Use External PostgreSQL (Recommended for Production)**

If using an external database:
1. Comment out or delete `k8s/base/postgres-deployment.yaml` from `k8s/base/kustomization.yaml`
2. Update `k8s/base/configmap.yaml` with your external database host
3. Run schema.sql and seed.sql on your external database manually

### Step 6: Deploy Application to ArgoCD

```bash
# Deploy the application
./argocd/deploy-application.sh
```

This creates the ArgoCD Application resource, which will:
- Monitor your Git repository
- Automatically sync changes
- Deploy to your k3s cluster

**Verify deployment:**
```bash
# Check ArgoCD application status
kubectl get application charno-web -n argocd

# Check pods in charno-web namespace
kubectl get pods -n charno-web

# Watch the deployment
watch kubectl get pods -n charno-web
```

### Step 7: Push Code to GitHub

```bash
# Add all files
git add .

# Commit
git commit -m "Add CI/CD pipeline with GitHub Actions and ArgoCD"

# Push to main branch
git push origin main
```

This will trigger:
1. GitHub Actions workflow
2. Build and test backend and frontend
3. Push Docker images to GHCR
4. Update image tags in k8s manifests
5. ArgoCD detects changes and syncs to k3s

## Accessing Your Application

### Via Port Forward (Testing)

```bash
# Frontend
kubectl port-forward svc/charno-frontend -n charno-web 3000:8080

# Backend
kubectl port-forward svc/charno-backend -n charno-web 5000:5000

# Visit: http://localhost:3000
```

### Via Ingress (Production)

If you configured an ingress with a domain:
```bash
# Visit your domain
https://charno.yourdomain.com
```

Make sure:
1. DNS points to your k3s server IP
2. Firewall allows ports 80/443
3. If using TLS, cert-manager is installed and configured

## CI/CD Workflow

### How It Works

1. **Developer pushes code** to `main` branch
2. **GitHub Actions** triggers:
   - Installs dependencies
   - Runs linter (if configured)
   - Runs tests (if configured)
   - Builds Docker images
   - Pushes images to GHCR
   - Updates image tags in k8s manifests
   - Commits tag updates back to repo
3. **ArgoCD** detects Git changes:
   - Syncs new manifests
   - Performs rolling update
   - Ensures cluster matches Git state

### Monitoring Deployments

**GitHub Actions:**
- View workflow runs: `https://github.com/YOUR_USERNAME/YOUR_REPO/actions`

**ArgoCD:**
```bash
# Via CLI
kubectl get application charno-web -n argocd -o yaml

# Via UI
kubectl port-forward svc/argocd-server -n argocd 8080:443
# Visit: https://localhost:8080
```

**Kubernetes:**
```bash
# Check pods
kubectl get pods -n charno-web

# View logs
kubectl logs -f deployment/charno-backend -n charno-web
kubectl logs -f deployment/charno-frontend -n charno-web

# Check events
kubectl get events -n charno-web --sort-by='.lastTimestamp'
```

## Troubleshooting

### Images Not Pulling from GHCR

```bash
# Verify secret exists
kubectl get secret ghcr-secret -n charno-web

# Verify secret is correct
kubectl get secret ghcr-secret -n charno-web -o jsonpath='{.data.\.dockerconfigjson}' | base64 -d

# Recreate if needed
./argocd/setup-ghcr-secret.sh
```

### ArgoCD Not Syncing

```bash
# Check application status
kubectl describe application charno-web -n argocd

# Force refresh
kubectl patch application charno-web -n argocd --type merge -p '{"metadata":{"annotations":{"argocd.argoproj.io/refresh":"hard"}}}'

# Manual sync
argocd app sync charno-web
```

### Database Connection Issues

```bash
# Check database pod
kubectl get pods -l app=postgres -n charno-web

# Check database logs
kubectl logs -l app=postgres -n charno-web

# Test connection from backend
kubectl exec -it deployment/charno-backend -n charno-web -- sh
# Inside pod:
nc -zv postgres 5432
```

### View Application Logs

```bash
# Backend logs
kubectl logs -f deployment/charno-backend -n charno-web

# Frontend logs
kubectl logs -f deployment/charno-frontend -n charno-web

# All logs
kubectl logs -f -l app.kubernetes.io/name=charno-web -n charno-web
```

## Rolling Back Deployments

### Via ArgoCD

```bash
# View history
argocd app history charno-web

# Rollback to previous version
argocd app rollback charno-web <REVISION_ID>
```

### Via Git

```bash
# Revert commit
git revert <commit-hash>
git push origin main

# ArgoCD will automatically sync the revert
```

## Scaling

### Manual Scaling

```bash
# Scale backend
kubectl scale deployment charno-backend -n charno-web --replicas=3

# Scale frontend
kubectl scale deployment charno-frontend -n charno-web --replicas=3
```

**Note:** Manual scaling will be overwritten by ArgoCD on next sync. To persist, update `k8s/base/*-deployment.yaml` and commit.

### Auto-scaling with HPA

To enable horizontal pod autoscaling:

```yaml
# Create HPA for backend
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

## Security Best Practices

1. **Secrets Management:**
   - Never commit secrets to Git
   - Consider using Sealed Secrets or External Secrets Operator
   - Rotate secrets regularly

2. **Image Security:**
   - Images run as non-root user (UID 1001)
   - Security contexts enforced
   - Use specific image tags (not `latest`) in production

3. **Network Policies:**
   - Consider adding NetworkPolicy resources to restrict pod-to-pod traffic

4. **TLS/HTTPS:**
   - Install cert-manager for automatic TLS certificates
   - Enable TLS in ingress configuration

## Maintenance

### Updating Dependencies

```bash
# Update backend dependencies
cd backend && npm update && npm audit fix

# Update frontend dependencies
cd frontend && npm update && npm audit fix

# Commit and push
git add .
git commit -m "Update dependencies"
git push origin main
```

### Database Backups

```bash
# Create backup
kubectl exec -n charno-web $(kubectl get pod -l app=postgres -n charno-web -o jsonpath='{.items[0].metadata.name}') -- pg_dump -U charno_user charno_web > backup.sql

# Restore backup
kubectl exec -i -n charno-web $(kubectl get pod -l app=postgres -n charno-web -o jsonpath='{.items[0].metadata.name}') -- psql -U charno_user charno_web < backup.sql
```

### ArgoCD Upgrade

```bash
# Check current version
kubectl get pods -n argocd -o jsonpath='{.items[0].spec.containers[0].image}'

# Upgrade to latest
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

## Additional Resources

- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [k3s Documentation](https://docs.k3s.io/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GHCR Documentation](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Kubernetes Documentation](https://kubernetes.io/docs/)

## Support

For issues specific to this deployment:
1. Check the troubleshooting section above
2. View GitHub Actions logs
3. Check ArgoCD application status
4. Review pod logs in k3s

For general questions about the technologies:
- k3s: https://github.com/k3s-io/k3s/issues
- ArgoCD: https://github.com/argoproj/argo-cd/issues
