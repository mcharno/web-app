const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function requireApiKey(req, res, next) {
  if (!MUTATING_METHODS.has(req.method)) {
    return next();
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error('API_KEY environment variable not set');
    return res.status(503).json({ error: 'Authentication not configured' });
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token || token !== apiKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}
