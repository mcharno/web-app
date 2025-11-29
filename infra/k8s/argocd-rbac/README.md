# ArgoCD RBAC Fix

This directory contains RBAC manifests to grant ArgoCD application controller the necessary cluster-wide permissions.

## Problem

ArgoCD application controller needs cluster-wide permissions to manage resources and discover the cluster state, including:
- Core resources (pods, services, configmaps, secrets, etc.)
- Policy resources (PodDisruptionBudgets)
- Admission webhooks (MutatingWebhookConfigurations, ValidatingWebhookConfigurations)
- Storage, networking, RBAC, and other cluster resources

Common errors you might see:
```
failed to list resources: poddisruptionbudgets.policy is forbidden:
User "system:serviceaccount:cicd:argocd-application-controller" cannot list resource "poddisruptionbudgets"

failed to list resources: mutatingwebhookconfigurations.admissionregistration.k8s.io is forbidden:
User "system:serviceaccount:cicd:argocd-application-controller" cannot list resource "mutatingwebhookconfigurations"
```

## Solution

Apply the ClusterRole and ClusterRoleBinding to grant the necessary permissions.

## Choose Your Approach

**We provide two ClusterRole options** - see [APPROACH.md](APPROACH.md) for details:

1. **clusterrole.yaml** - Granular permissions (more secure, more maintenance)
2. **clusterrole-simple.yaml** - Read-all approach (recommended for homelab)

**For homelab/k3s, use the simplified approach** to avoid constant "forbidden" errors.

## Apply RBAC Permissions (Simplified - Recommended)

```bash
# Apply the simplified ClusterRole (read all, write specific)
kubectl apply -f infra/k8s/argocd-rbac/clusterrole-simple.yaml

# Apply the ClusterRoleBinding (grants permissions to ArgoCD service account)
kubectl apply -f infra/k8s/argocd-rbac/clusterrolebinding.yaml

# Restart ArgoCD to pick up permissions
kubectl rollout restart deployment argocd-application-controller -n cicd
kubectl rollout status deployment argocd-application-controller -n cicd
```

## Verify

```bash
# Check if the ClusterRole was created
kubectl get clusterrole argocd-application-controller-extended

# Check if the ClusterRoleBinding was created
kubectl get clusterrolebinding argocd-application-controller-extended

# Verify ArgoCD can now sync applications
kubectl get applications -n cicd
```

## What This Does

- **ClusterRole**: Defines comprehensive permissions including:
  - Core resources (pods, services, configmaps, secrets, namespaces, etc.)
  - Apps resources (deployments, statefulsets, daemonsets, etc.)
  - Networking (ingresses, network policies)
  - RBAC (roles, rolebindings, clusterroles, clusterrolebindings)
  - Policy (PodDisruptionBudgets, PodSecurityPolicies)
  - Admission (MutatingWebhookConfigurations, ValidatingWebhookConfigurations)
  - Storage, autoscaling, CRDs, and other cluster resources
  - Optional: cert-manager, service mesh resources

- **ClusterRoleBinding**: Binds the ClusterRole to the `argocd-application-controller` service account in the `cicd` namespace

## Security Note

These permissions are cluster-wide and grant ArgoCD broad access to manage resources across all namespaces. This is the standard setup for ArgoCD in production environments where ArgoCD is trusted to manage the entire cluster.

**Important**: Only apply these permissions if:
- ArgoCD is the primary deployment tool for your cluster
- You trust ArgoCD to manage resources across all namespaces
- You understand the security implications of cluster-admin-like permissions

## Troubleshooting

If you continue to see "forbidden" errors after applying these RBAC manifests:

1. **Verify the ClusterRole was created**:
   ```bash
   kubectl get clusterrole argocd-application-controller-extended
   kubectl describe clusterrole argocd-application-controller-extended
   ```

2. **Verify the ClusterRoleBinding was created**:
   ```bash
   kubectl get clusterrolebinding argocd-application-controller-extended
   kubectl describe clusterrolebinding argocd-application-controller-extended
   ```

3. **Check the service account**:
   ```bash
   kubectl get serviceaccount argocd-application-controller -n cicd
   ```

4. **Restart ArgoCD application controller** (to pick up new permissions):
   ```bash
   kubectl rollout restart deployment argocd-application-controller -n cicd
   ```

5. **Check ArgoCD logs** for any remaining permission errors:
   ```bash
   kubectl logs -n cicd -l app.kubernetes.io/name=argocd-application-controller --tail=100
   ```
