import client from 'prom-client';

// Create a Registry to register the metrics
const register = new client.Registry();

// Add default metrics (CPU, memory, event loop lag, etc.)
client.collectDefaultMetrics({
  register,
  prefix: 'charno_web_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
});

// ============================================================================
// HTTP Metrics
// ============================================================================

// HTTP request duration histogram
const httpRequestDuration = new client.Histogram({
  name: 'charno_web_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.015, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 1, 2, 5],
  registers: [register],
});

// HTTP request counter
const httpRequestTotal = new client.Counter({
  name: 'charno_web_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Active requests gauge
const httpRequestsInProgress = new client.Gauge({
  name: 'charno_web_http_requests_in_progress',
  help: 'Number of HTTP requests currently being processed',
  labelNames: ['method'],
  registers: [register],
});

// ============================================================================
// User Analytics Metrics
// ============================================================================

// Page views counter
const pageViewsTotal = new client.Counter({
  name: 'charno_web_page_views_total',
  help: 'Total number of page views',
  labelNames: ['page', 'section'],
  registers: [register],
});

// Unique visitors counter (approximation using IPs)
const uniqueVisitors = new client.Counter({
  name: 'charno_web_unique_visitors_total',
  help: 'Total number of unique visitors (by IP)',
  labelNames: ['country', 'user_agent_type'],
  registers: [register],
});

// Content interactions
const contentInteractions = new client.Counter({
  name: 'charno_web_content_interactions_total',
  help: 'Total number of content interactions (blog views, project views, etc.)',
  labelNames: ['content_type', 'content_id', 'action'],
  registers: [register],
});

// Gallery views
const galleryViews = new client.Counter({
  name: 'charno_web_gallery_views_total',
  help: 'Total number of photo gallery views',
  labelNames: ['gallery_id', 'gallery_name'],
  registers: [register],
});

// ============================================================================
// Performance Metrics
// ============================================================================

// Response size histogram
const httpResponseSize = new client.Histogram({
  name: 'charno_web_http_response_size_bytes',
  help: 'Size of HTTP responses in bytes',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [100, 1000, 5000, 10000, 50000, 100000, 500000, 1000000],
  registers: [register],
});

// Database query duration
const dbQueryDuration = new client.Histogram({
  name: 'charno_web_db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

// Database query errors
const dbQueryErrors = new client.Counter({
  name: 'charno_web_db_query_errors_total',
  help: 'Total number of database query errors',
  labelNames: ['operation', 'table', 'error_type'],
  registers: [register],
});

// Cache hits/misses
const cacheHits = new client.Counter({
  name: 'charno_web_cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_type'],
  registers: [register],
});

const cacheMisses = new client.Counter({
  name: 'charno_web_cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_type'],
  registers: [register],
});

// ============================================================================
// Error Metrics
// ============================================================================

// Error counter
const errorsTotal = new client.Counter({
  name: 'charno_web_errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'route', 'status_code'],
  registers: [register],
});

// ============================================================================
// Visitor Tracking (In-Memory Set for Deduplication)
// ============================================================================

// Track unique visitors per day (simple in-memory approach)
const visitorSet = new Set();
let lastResetDate = new Date().toDateString();

// Reset visitor set daily
function resetVisitorSetIfNeeded() {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    visitorSet.clear();
    lastResetDate = today;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function getUserAgentType(userAgent) {
  if (!userAgent) return 'unknown';
  if (userAgent.includes('Mobile')) return 'mobile';
  if (userAgent.includes('Tablet')) return 'tablet';
  if (userAgent.includes('bot') || userAgent.includes('Bot')) return 'bot';
  return 'desktop';
}

function getRoutePattern(path) {
  // Normalize routes for metrics (replace IDs with :id)
  return path
    .replace(/\/\d+/g, '/:id')
    .replace(/\/[a-f0-9-]{36}/g, '/:uuid')
    .replace(/\/[a-zA-Z0-9_-]{10,}/g, '/:slug');
}

function getPageSection(path) {
  if (path.startsWith('/api/blog')) return 'blog';
  if (path.startsWith('/api/projects')) return 'projects';
  if (path.startsWith('/api/photos')) return 'photos';
  if (path.startsWith('/api/papers')) return 'papers';
  if (path.startsWith('/api/content')) return 'content';
  return 'other';
}

// ============================================================================
// Metrics Middleware
// ============================================================================

export function metricsMiddleware(req, res, next) {
  const startTime = Date.now();
  const method = req.method;
  const originalUrl = req.originalUrl || req.url;

  // Increment in-progress requests
  httpRequestsInProgress.inc({ method });

  // Track unique visitors
  resetVisitorSetIfNeeded();
  const visitorId = req.ip || req.connection.remoteAddress;
  if (visitorId && !visitorSet.has(visitorId)) {
    visitorSet.add(visitorId);
    const userAgentType = getUserAgentType(req.get('user-agent'));
    uniqueVisitors.inc({ country: 'unknown', user_agent_type: userAgentType });
  }

  // Track page views for content endpoints
  const section = getPageSection(originalUrl);
  if (section !== 'other' && method === 'GET') {
    pageViewsTotal.inc({ page: originalUrl, section });
  }

  // Override res.end to capture metrics after response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    // Restore original end function
    res.end = originalEnd;
    res.end(chunk, encoding);

    // Calculate request duration
    const duration = (Date.now() - startTime) / 1000; // Convert to seconds
    const statusCode = res.statusCode.toString();
    const route = getRoutePattern(originalUrl);

    // Decrement in-progress requests
    httpRequestsInProgress.dec({ method });

    // Record metrics
    httpRequestDuration.observe({ method, route, status_code: statusCode }, duration);
    httpRequestTotal.inc({ method, route, status_code: statusCode });

    // Track response size if available
    const contentLength = res.get('Content-Length');
    if (contentLength) {
      httpResponseSize.observe(
        { method, route, status_code: statusCode },
        parseInt(contentLength, 10)
      );
    }

    // Track errors
    if (statusCode.startsWith('4') || statusCode.startsWith('5')) {
      errorsTotal.inc({ type: statusCode.startsWith('4') ? 'client' : 'server', route, status_code: statusCode });
    }
  };

  next();
}

// ============================================================================
// Metrics Endpoint Handler
// ============================================================================

export async function metricsHandler(req, res) {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (err) {
    res.status(500).end(err);
  }
}

// ============================================================================
// Content Tracking Functions
// ============================================================================

export function trackContentView(contentType, contentId) {
  contentInteractions.inc({
    content_type: contentType,
    content_id: contentId || 'unknown',
    action: 'view',
  });
}

export function trackGalleryView(galleryId, galleryName) {
  galleryViews.inc({
    gallery_id: galleryId || 'unknown',
    gallery_name: galleryName || 'unknown',
  });
}

// ============================================================================
// Database Tracking Functions
// ============================================================================

export function trackDbQuery(operation, table, duration) {
  dbQueryDuration.observe({ operation, table }, duration);
}

export function trackDbError(operation, table, errorType) {
  dbQueryErrors.inc({ operation, table, error_type: errorType });
}

// ============================================================================
// Cache Tracking Functions
// ============================================================================

export function trackCacheHit(cacheType) {
  cacheHits.inc({ cache_type: cacheType });
}

export function trackCacheMiss(cacheType) {
  cacheMisses.inc({ cache_type: cacheType });
}

// ============================================================================
// Exports
// ============================================================================

export default {
  metricsMiddleware,
  metricsHandler,
  trackContentView,
  trackGalleryView,
  trackDbQuery,
  trackDbError,
  trackCacheHit,
  trackCacheMiss,
  register,
};
