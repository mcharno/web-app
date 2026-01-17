#!/bin/bash
set -euo pipefail

# Script to create a sealed secret for GitHub Container Registry authentication
# This allows GitOps deployment while keeping credentials secure

NAMESPACE="web"
SECRET_NAME="ghcr-secret"
SEALED_SECRET_FILE="infra/k8s/base/ghcr-sealed-secret.yaml"

echo "==================================================================="
echo "GitHub Container Registry (GHCR) Sealed Secret Generator"
echo "==================================================================="
echo ""
echo "This script will create a sealed secret for pulling private images"
echo "from GitHub Container Registry."
echo ""
echo "You will need:"
echo "  1. Your GitHub username"
echo "  2. A GitHub Personal Access Token (PAT) with 'read:packages' scope"
echo ""
echo "To create a PAT:"
echo "  1. Go to: https://github.com/settings/tokens/new"
echo "  2. Note: 'GHCR read access for k8s'"
echo "  3. Expiration: 90 days (or your preference)"
echo "  4. Select scope: read:packages"
echo "  5. Generate token and copy it"
echo ""
read -p "Press Enter to continue..."

# Prompt for credentials
read -p "Enter your GitHub username: " GITHUB_USERNAME
read -sp "Enter your GitHub PAT: " GITHUB_TOKEN
echo ""

if [ -z "$GITHUB_USERNAME" ] || [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ Error: Username and token are required"
    exit 1
fi

echo ""
echo "Creating sealed secret..."

# Create temporary docker-registry secret
kubectl create secret docker-registry "$SECRET_NAME" \
  --docker-server=ghcr.io \
  --docker-username="$GITHUB_USERNAME" \
  --docker-password="$GITHUB_TOKEN" \
  --docker-email="$GITHUB_USERNAME@users.noreply.github.com" \
  --namespace="$NAMESPACE" \
  --dry-run=client -o yaml | \
  kubeseal --format yaml --namespace="$NAMESPACE" > "$SEALED_SECRET_FILE"

# Add labels to the sealed secret
cat > "$SEALED_SECRET_FILE.tmp" << EOF
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: $SECRET_NAME
  namespace: $NAMESPACE
  labels:
    app.kubernetes.io/name: web
    app.kubernetes.io/managed-by: argocd
spec:
$(tail -n +7 "$SEALED_SECRET_FILE" | sed 's/^/  /')
EOF

mv "$SEALED_SECRET_FILE.tmp" "$SEALED_SECRET_FILE"

echo "✅ Sealed secret created: $SEALED_SECRET_FILE"
echo ""
echo "Next steps:"
echo "  1. Review the sealed secret file"
echo "  2. Add it to kustomization.yaml resources"
echo "  3. Commit and push to trigger ArgoCD sync"
echo ""
echo "The sealed secret is safe to commit to Git - it can only be"
echo "decrypted by the sealed-secrets controller in your cluster."
