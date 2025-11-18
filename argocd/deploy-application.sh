#!/bin/bash
# Script to deploy the application to ArgoCD

set -e

echo "Deploying Charno Web application to ArgoCD..."
echo ""

# Check if ArgoCD is installed
if ! kubectl get namespace argocd &> /dev/null; then
    echo "Error: ArgoCD namespace not found. Please install ArgoCD first:"
    echo "  ./argocd/install-argocd.sh"
    exit 1
fi

# Apply the ArgoCD application manifest
echo "Applying ArgoCD application manifest..."
kubectl apply -f argocd/application.yaml

echo ""
echo "==================================================================="
echo "Application deployed to ArgoCD!"
echo "==================================================================="
echo ""
echo "ArgoCD will now automatically sync the application from Git."
echo ""
echo "To view the application:"
echo "  kubectl get applications -n argocd"
echo ""
echo "To check sync status:"
echo "  kubectl get application charno-web -n argocd -o jsonpath='{.status.sync.status}'"
echo ""
echo "To view in ArgoCD UI:"
echo "  1. Port forward: kubectl port-forward svc/argocd-server -n argocd 8080:443"
echo "  2. Visit: https://localhost:8080"
echo "  3. Login with admin credentials"
echo "  4. Click on 'charno-web' application"
echo ""
echo "To manually sync (if needed):"
echo "  kubectl patch application charno-web -n argocd --type merge -p '{\"metadata\":{\"annotations\":{\"argocd.argoproj.io/refresh\":\"hard\"}}}'"
echo ""
