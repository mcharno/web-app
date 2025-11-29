# ArgoCD RBAC - Two Approaches

You have two options for granting ArgoCD permissions. Choose based on your needs:

## Approach 1: Granular Permissions (Current - clusterrole.yaml)

**File**: `clusterrole.yaml`

**Pros**:
- More secure - only specific resources listed
- Better for production environments
- Clear audit trail of what ArgoCD can access

**Cons**:
- You'll keep hitting "forbidden" errors as ArgoCD discovers new resource types
- Requires updating and reapplying whenever you add new CRDs or operators
- Time-consuming to troubleshoot

**Best for**: Production environments with strict security requirements

## Approach 2: Simplified Read-All (Recommended for Homelab - clusterrole-simple.yaml)

**File**: `clusterrole-simple.yaml`

**Pros**:
- No more "forbidden" errors - ArgoCD can discover all resources
- One-time setup
- Still restricts write/modify permissions to common resources
- Standard approach for homelab/dev environments

**Cons**:
- ArgoCD can read (but not modify) all cluster resources
- Less granular than approach 1

**Best for**: Homelab, development, and small production environments where ArgoCD is trusted

## Which Should You Use?

**For your homelab k3s cluster, I recommend Approach 2 (clusterrole-simple.yaml)**

The errors you're seeing (RuntimeClass, ETCDSnapshot, ACME challenges, etc.) are ArgoCD trying to discover what resource types exist in your cluster. The simplified approach grants read access to all resources, which eliminates these errors while still restricting write access.

## How to Apply

### Switch to Simplified Approach (Recommended)

```bash
# Apply the simplified ClusterRole
kubectl apply -f infra/k8s/argocd-rbac/clusterrole-simple.yaml

# The ClusterRoleBinding stays the same
kubectl apply -f infra/k8s/argocd-rbac/clusterrolebinding.yaml

# Restart ArgoCD to pick up new permissions
kubectl rollout restart deployment argocd-application-controller -n cicd
kubectl rollout status deployment argocd-application-controller -n cicd
```

### Verify It Works

```bash
# Check for errors - should be none
kubectl logs -n cicd -l app.kubernetes.io/name=argocd-application-controller --tail=100 | grep -i forbidden

# Check application status
kubectl get application linked-data-service -n cicd

# Check sync status
kubectl get application linked-data-service -n cicd -o jsonpath='{.status.sync.status}'
```

## What the Simplified Approach Does

```yaml
# Read access to EVERYTHING (for cluster discovery)
- apiGroups: ["*"]
  resources: ["*"]
  verbs: [get, list, watch]

# Write access ONLY to resources ArgoCD needs to manage
- apiGroups: ["", "apps", "batch", "networking.k8s.io", ...]
  resources: [deployments, services, configmaps, ...]
  verbs: [create, update, patch, delete]
```

This means:
- ✅ ArgoCD can see (read) all resource types → no more forbidden errors
- ✅ ArgoCD can only modify resources you explicitly allow
- ✅ RuntimeClasses, ETCDSnapshots, etc. are readable but not modifiable
- ✅ Your applications deploy without permission issues

## Reverting to Granular Approach

If you later want more restrictive permissions:

```bash
# Apply the granular ClusterRole
kubectl apply -f infra/k8s/argocd-rbac/clusterrole.yaml
kubectl rollout restart deployment argocd-application-controller -n cicd
```

Note: You'll need to add permissions for any new resource types that cause forbidden errors.
