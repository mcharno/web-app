# Charno Web - Grafana Dashboard Setup

This document explains how to set up the custom Grafana dashboard for monitoring the Charno Web application.

## Overview

The custom dashboard provides comprehensive visibility into:
- **User Analytics**: Page views, unique visitors, content interactions
- **Performance Metrics**: Response times (P50, P95, P99), request rates
- **Content Tracking**: Most viewed content, gallery views, blog post views
- **Device Analytics**: Visitor breakdown by device type (mobile, desktop, bot)
- **Error Monitoring**: Error rates and types

## Prerequisites

1. Prometheus is scraping the `/metrics` endpoint from the charno-backend service
2. The ServiceMonitor has been applied to the cluster
3. You have access to Grafana at https://monitor.charn.io

## Dashboard Import Methods

### Method 1: Manual Import (Recommended for First Time)

1. **Access Grafana**
   - Navigate to https://monitor.charn.io
   - Login with admin credentials

2. **Import Dashboard**
   - Click the "+" icon in the left sidebar
   - Select "Import"
   - Click "Upload JSON file"
   - Select: `infra/k8s/base/grafana-dashboard-charno-web.json`
   - Click "Load"

3. **Configure Dashboard**
   - Select Prometheus datasource: "prometheus"
   - Click "Import"

4. **Verify Dashboard**
   - Dashboard should display with panels showing metrics
   - If panels show "No data", wait a few minutes for Prometheus to scrape metrics
   - Alternatively, generate traffic to the web app to create metrics

### Method 2: Provisioning via ConfigMap (Automated)

To automatically provision the dashboard in Grafana on startup:

1. **Create Dashboard ConfigMap**
   ```bash
   kubectl create configmap charno-web-dashboard \
     --from-file=charno-web-analytics.json=infra/k8s/base/grafana-dashboard-charno-web.json \
     -n monitoring \
     --dry-run=client -o yaml | kubectl apply -f -
   ```

2. **Add Label for Grafana Discovery**
   ```bash
   kubectl label configmap charno-web-dashboard -n monitoring grafana_dashboard=1
   ```

3. **Update Grafana Deployment** (if not already configured)

   Add volume mount in `/Users/charno/projects/homelab/infra-k8s/apps/grafana/base/deployment.yaml`:

   ```yaml
   volumeMounts:
   - name: dashboards
     mountPath: /etc/grafana/provisioning/dashboards

   volumes:
   - name: dashboards
     configMap:
       name: charno-web-dashboard
   ```

4. **Restart Grafana**
   ```bash
   kubectl rollout restart deployment/grafana -n monitoring
   ```

## Dashboard Panels

### Overview Stats (Top Row)
- **Requests/sec**: Current request rate across all endpoints
- **Unique Visitors (Today)**: Number of unique IP addresses that visited today
- **P95 Response Time**: 95th percentile response time in milliseconds
- **Errors/sec**: Current error rate

### Performance Metrics
- **Request Rate by Route**: Time series showing requests/sec per API route
- **Response Time Percentiles by Route**: P50, P95, P99 latencies per route

### User Analytics
- **Page Views by Section**: Pie chart showing distribution (blog, projects, photos, papers)
- **Visitors by Device Type**: Desktop vs mobile vs bot breakdown
- **Top 10 Content Views**: Table showing most viewed content with type and ID
- **Content Interactions Rate**: Time series of content views by type

### Photo Gallery Analytics
- **Top 10 Photo Galleries**: Table showing most viewed galleries

## Metrics Reference

### HTTP Metrics
- `charno_web_http_requests_total` - Total requests by method, route, status
- `charno_web_http_request_duration_seconds` - Request latency histogram
- `charno_web_http_requests_in_progress` - Active requests gauge
- `charno_web_http_response_size_bytes` - Response size histogram

### User Analytics Metrics
- `charno_web_page_views_total` - Page views by page and section
- `charno_web_unique_visitors_total` - Unique visitors by country and user agent type
- `charno_web_content_interactions_total` - Content views by type, ID, and action
- `charno_web_gallery_views_total` - Gallery views by gallery ID and name

### Performance Metrics
- `charno_web_db_query_duration_seconds` - Database query latency histogram
- `charno_web_db_query_errors_total` - Database errors by operation and table
- `charno_web_cache_hits_total` - Cache hits by cache type
- `charno_web_cache_misses_total` - Cache misses by cache type

### Error Metrics
- `charno_web_errors_total` - Errors by type, route, and status code

### Default Node.js Metrics
- `charno_web_process_cpu_*` - CPU usage metrics
- `charno_web_process_resident_memory_bytes` - Memory usage
- `charno_web_nodejs_eventloop_lag_*` - Event loop lag metrics
- `charno_web_nodejs_gc_duration_seconds` - Garbage collection metrics

## Testing the Dashboard

### Generate Test Traffic

1. **Start the backend locally** (optional for testing)
   ```bash
   cd /Users/charno/projects/homelab/web-app
   yarn workspace charno-backend start
   ```

2. **Make test requests**
   ```bash
   # List endpoints
   curl http://localhost:3080/api/blog
   curl http://localhost:3080/api/projects
   curl http://localhost:3080/api/papers

   # Individual content
   curl http://localhost:3080/api/blog/welcome-to-my-blog
   curl http://localhost:3080/api/projects/linked-data-toolkit

   # Photos
   curl http://localhost:3080/api/photos/galleries
   ```

3. **Check metrics**
   ```bash
   curl http://localhost:3080/metrics | grep charno_web
   ```

### Verify in Production

Once deployed to production:

1. Visit your website normally
2. Navigate through different pages (blog, projects, photos)
3. Wait 30-60 seconds for Prometheus to scrape
4. Check Grafana dashboard for updated metrics

## Troubleshooting

### No Data in Panels

**Check ServiceMonitor**
```bash
kubectl get servicemonitor -n web
kubectl describe servicemonitor charno-backend -n web
```

**Check Prometheus Targets**
1. Access Prometheus UI (if available)
2. Go to Status → Targets
3. Look for `web/charno-backend` target
4. Verify it shows as "UP"

**Check Metrics Endpoint**
```bash
kubectl port-forward -n web svc/charno-backend 3080:3080
curl http://localhost:3080/metrics
```

Should return Prometheus format metrics starting with `# HELP charno_web_...`

### Dashboard Shows Errors

**Check Prometheus Datasource**
1. In Grafana: Configuration → Data Sources
2. Select "prometheus"
3. Click "Test" button
4. Should show "Data source is working"

**Check PromQL Queries**
- Dashboard panels use standard PromQL
- If queries fail, check Prometheus has scraped the metrics
- Verify metric names match what's exposed at `/metrics`

### Unique Visitors Reset

The unique visitors counter resets daily (by design):
- Tracked in-memory using a Set
- Resets at midnight based on server date
- Does not persist across pod restarts
- For persistent visitor tracking, consider adding Redis or database storage

## Customization

### Add New Panels

1. Click "Add panel" button
2. Select visualization type
3. Add PromQL query using available metrics
4. Configure display options
5. Save dashboard

### Modify Existing Panels

1. Click panel title → Edit
2. Modify query, visualization, or display options
3. Click "Apply"
4. Save dashboard

### Export Updated Dashboard

After making changes:
1. Click dashboard settings (gear icon)
2. Click "JSON Model"
3. Copy JSON
4. Save to `infra/k8s/base/grafana-dashboard-charno-web.json`
5. Commit to git

## Dashboard Maintenance

### Refresh Rate
- Default: 30 seconds
- Can be changed in dashboard settings

### Time Range
- Default: Last 6 hours
- Adjust using time picker in top-right

### Variables
- Currently no variables defined
- Can add variables for filtering by route, content type, etc.

## Next Steps

1. Import the dashboard using Method 1
2. Generate test traffic to populate data
3. Review panels and customize as needed
4. Set up alerting rules (optional)
5. Create additional dashboards for specific use cases

## References

- [Prometheus Query Documentation](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Grafana Dashboard Documentation](https://grafana.com/docs/grafana/latest/dashboards/)
- [prom-client Library](https://github.com/siimon/prom-client)
