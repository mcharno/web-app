# Quick Deploy Reference - Charno Web App

Quick reference for deploying and managing the charno-web application on k3s.

## One-Time Setup

### 1. Apply RBAC Fix
```bash
# Apply simplified RBAC permissions (recommended for k3s homelab)
kubectl apply -f infra/k8s/argocd-rbac/clusterrole-simple.yaml
kubectl apply -f infra/k8s/argocd-rbac/clusterrolebinding.yaml

# Restart ArgoCD application controller to pick up new permissions
kubectl rollout restart deployment argocd-application-controller -n cicd

# Wait for restart to complete
kubectl rollout status deployment argocd-application-controller -n cicd

# Verify no forbidden errors
kubectl logs -n cicd -l app.kubernetes.io/name=argocd-application-controller --tail=50 | grep -i forbidden
```

### 2. Create Secrets
```bash
# GHCR pull secret
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=YOUR_USERNAME \
  --docker-password=YOUR_GITHUB_PAT \
  -n charno-web

# Application secrets (database credentials)
kubectl create secret generic charno-secrets \
  --from-literal=db_user=YOUR_DB_USER \
  --from-literal=db_password=YOUR_DB_PASSWORD \
  -n charno-web
```

### 3. Deploy ArgoCD Application
```bash
kubectl apply -f infra/argocd/application.yaml
```

## Common Operations

### Check Status
```bash
# Application status
kubectl get application charno-web -n cicd

# Pods
kubectl get pods -n charno-web

# All resources
kubectl get all -n charno-web
```

### Trigger Manual Sync
```bash
kubectl patch application charno-web -n cicd \
  --type merge \
  --patch '{"operation": {"initiatedBy": {"username": "kubectl"}, "sync": {"revision": "HEAD"}}}'
```

### View Logs
```bash
# Backend logs
kubectl logs -n charno-web -l app=charno-backend --tail=50

# Frontend logs
kubectl logs -n charno-web -l app=charno-frontend --tail=50

# Follow logs
kubectl logs -n charno-web -l app=charno-backend -f
```

### Check Health
```bash
# Via kubectl
kubectl get pods -n charno-web

# Via API (frontend)
curl https://charno.net/health

# Via API (backend)
curl https://charno.net/api/health
```

### Restart Deployments
```bash
# Restart backend
kubectl rollout restart deployment charno-backend -n charno-web

# Restart frontend
kubectl rollout restart deployment charno-frontend -n charno-web

# Restart both
kubectl rollout restart deployment -n charno-web
```

### Scale Replicas
```bash
# Scale backend to 3 replicas
kubectl scale deployment charno-backend -n charno-web --replicas=3

# Scale frontend to 3 replicas
kubectl scale deployment charno-frontend -n charno-web --replicas=3

# Scale back to 2
kubectl scale deployment charno-backend -n charno-web --replicas=2
kubectl scale deployment charno-frontend -n charno-web --replicas=2
```

## Troubleshooting

### Check Application Sync Status
```bash
kubectl get application charno-web -n cicd -o jsonpath='{.status.sync.status}'
```

### Check Health Status
```bash
kubectl get application charno-web -n cicd -o jsonpath='{.status.health.status}'
```

### View Sync Errors
```bash
kubectl get application charno-web -n cicd -o jsonpath='{.status.operationState.message}'
```

### Describe Pod Issues
```bash
# Backend pods
kubectl describe pods -n charno-web -l app=charno-backend

# Frontend pods
kubectl describe pods -n charno-web -l app=charno-frontend
```

### Check Events
```bash
kubectl get events -n charno-web --sort-by='.lastTimestamp'
```

## Update Secrets

### Database Credentials
```bash
# Delete old secret
kubectl delete secret charno-secrets -n charno-web

# Create new secret
kubectl create secret generic charno-secrets \
  --from-literal=db_user=NEW_DB_USER \
  --from-literal=db_password=NEW_DB_PASSWORD \
  -n charno-web

# Restart deployments to pick up new secret
kubectl rollout restart deployment charno-backend -n charno-web
```

### GHCR Pull Secret
```bash
# Delete old secret
kubectl delete secret ghcr-secret -n charno-web

# Create new secret
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=YOUR_USERNAME \
  --docker-password=NEW_GITHUB_PAT \
  -n charno-web

# Restart deployments
kubectl rollout restart deployment -n charno-web
```

## Force Redeploy

```bash
# Delete the application (keeps resources)
kubectl delete application charno-web -n cicd

# Reapply
kubectl apply -f infra/argocd/application.yaml
```

## Access Service

```bash
# Via ingress
curl https://charno.net/
curl https://charno.net/api/health

# Port-forward for local testing (frontend)
kubectl port-forward -n charno-web svc/charno-frontend 3000:3000
curl http://localhost:3000/health

# Port-forward for local testing (backend)
kubectl port-forward -n charno-web svc/charno-backend 3080:3080
curl http://localhost:3080/api/health
```

## Useful Aliases

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
# ArgoCD
alias kapp='kubectl get application -n cicd'
alias kappd='kubectl get application -n cicd -o yaml'

# Charno Web
alias kweb='kubectl get all -n charno-web'
alias kwebp='kubectl get pods -n charno-web'
alias kwebl='kubectl logs -n charno-web'
alias kwebr='kubectl rollout restart deployment -n charno-web'

# Backend specific
alias kbe='kubectl get pods -n charno-web -l app=charno-backend'
alias kbel='kubectl logs -n charno-web -l app=charno-backend'
alias kber='kubectl rollout restart deployment charno-backend -n charno-web'

# Frontend specific
alias kfe='kubectl get pods -n charno-web -l app=charno-frontend'
alias kfel='kubectl logs -n charno-web -l app=charno-frontend'
alias kfer='kubectl rollout restart deployment charno-frontend -n charno-web'
```
