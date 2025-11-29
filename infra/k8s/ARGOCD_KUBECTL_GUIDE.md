# Managing ArgoCD with kubectl (No CLI Required)

If you don't have the `argocd` CLI installed, you can manage ArgoCD applications entirely with `kubectl`.

## Quick Reference

### Check Application Status

```bash
# List all ArgoCD applications
kubectl get applications -n cicd

# Get detailed status of linked-data-service
kubectl get application linked-data-service -n cicd -o yaml

# Get sync status (compact view)
kubectl get application linked-data-service -n cicd -o jsonpath='{.status.sync.status}'

# Get health status
kubectl get application linked-data-service -n cicd -o jsonpath='{.status.health.status}'
```

### Manually Sync Application

```bash
# Trigger a sync by updating the operation field
kubectl patch application linked-data-service -n cicd \
  --type merge \
  --patch '{"operation": {"initiatedBy": {"username": "admin"}, "sync": {"revision": "HEAD"}}}'

# Or use a more complete sync operation
kubectl patch application linked-data-service -n cicd \
  --type merge \
  --patch '{
    "operation": {
      "initiatedBy": {"username": "kubectl"},
      "sync": {
        "revision": "HEAD",
        "syncStrategy": {
          "hook": {}
        }
      }
    }
  }'
```

### Watch Application Sync Progress

```bash
# Watch the application status
kubectl get application linked-data-service -n cicd -w

# Watch with more details
watch "kubectl get application linked-data-service -n cicd -o jsonpath='{.status.operationState.phase}' && echo && kubectl get application linked-data-service -n cicd -o jsonpath='{.status.sync.status}'"
```

### Check Deployment in Target Namespace

```bash
# Check pods
kubectl get pods -n web -l app=linked-data-service

# Check all resources
kubectl get all -n web -l app=linked-data-service

# Check ingress
kubectl get ingress -n web
```

### Delete Application (if needed)

```bash
# Delete the ArgoCD application (does NOT delete deployed resources by default)
kubectl delete application linked-data-service -n cicd

# To also delete deployed resources, add a finalizer first:
kubectl patch application linked-data-service -n cicd \
  --type merge \
  --patch '{"metadata": {"finalizers": ["resources-finalizer.argocd.argoproj.io"]}}'
kubectl delete application linked-data-service -n cicd
```

### View Application Details

```bash
# Get compact status
kubectl get application linked-data-service -n cicd -o jsonpath='{.status}' | jq

# Get sync status
kubectl get application linked-data-service -n cicd \
  -o jsonpath='Sync: {.status.sync.status}, Health: {.status.health.status}'

# Get last sync time
kubectl get application linked-data-service -n cicd \
  -o jsonpath='{.status.operationState.finishedAt}'
```

## Complete Deployment Workflow (kubectl only)

### 1. Apply RBAC Fix

```bash
kubectl apply -f infra/k8s/argocd-rbac/clusterrole.yaml
kubectl apply -f infra/k8s/argocd-rbac/clusterrolebinding.yaml
```

### 2. Create Secrets

```bash
# Create GHCR pull secret
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=YOUR_USERNAME \
  --docker-password=YOUR_GITHUB_PAT \
  -n web

# Create application secrets
kubectl create secret generic linked-data-secrets \
  --from-literal=geonames_username=YOUR_GEONAMES_USERNAME \
  -n web
```

### 3. Deploy ArgoCD Application

```bash
kubectl apply -f infra/argocd/application.yaml
```

### 4. Monitor Deployment

```bash
# Check application was created
kubectl get application linked-data-service -n cicd

# Watch sync status
kubectl get application linked-data-service -n cicd -w

# Check deployed resources
kubectl get all -n web -l app=linked-data-service
```

### 5. Verify Service is Running

```bash
# Check pods
kubectl get pods -n web -l app=linked-data-service

# Check pod logs
kubectl logs -n web -l app=linked-data-service --tail=50

# Check service
kubectl get svc -n web

# Check ingress
kubectl get ingress -n web
```

## Troubleshooting with kubectl

### Check Application Conditions

```bash
kubectl get application linked-data-service -n cicd -o jsonpath='{.status.conditions}' | jq
```

### View Sync Errors

```bash
kubectl get application linked-data-service -n cicd -o jsonpath='{.status.operationState.message}'
```

### Check Resource Status

```bash
kubectl get application linked-data-service -n cicd -o jsonpath='{.status.resources}' | jq
```

### Force Refresh

```bash
kubectl patch application linked-data-service -n cicd \
  --type merge \
  --patch '{"metadata": {"annotations": {"argocd.argoproj.io/refresh": "hard"}}}'
```

## Installing ArgoCD CLI (Optional)

If you want to use the `argocd` CLI for convenience:

### Linux/WSL

```bash
curl -sSL -o argocd-linux-amd64 https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
sudo install -m 555 argocd-linux-amd64 /usr/local/bin/argocd
rm argocd-linux-amd64
```

### macOS

```bash
brew install argocd
```

### Login to ArgoCD

```bash
# Port-forward to ArgoCD server
kubectl port-forward svc/argocd-server -n cicd 8080:443 &

# Login
argocd login localhost:8080

# Get initial admin password
kubectl get secret argocd-initial-admin-secret -n cicd -o jsonpath='{.data.password}' | base64 -d
```

## Common kubectl Equivalents

| ArgoCD CLI Command | kubectl Equivalent |
|-------------------|-------------------|
| `argocd app list` | `kubectl get applications -n cicd` |
| `argocd app get APP` | `kubectl get application APP -n cicd -o yaml` |
| `argocd app sync APP` | `kubectl patch application APP -n cicd --type merge --patch '{"operation": {"initiatedBy": {"username": "kubectl"}, "sync": {"revision": "HEAD"}}}'` |
| `argocd app delete APP` | `kubectl delete application APP -n cicd` |
| `argocd app history APP` | `kubectl get application APP -n cicd -o jsonpath='{.status.history}'` |
| `argocd app rollback APP` | Update `.spec.source.targetRevision` in the application |
