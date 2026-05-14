import { Router } from 'express';
import spec from '../docs/openapi.js';

const router = Router();

// Raw OpenAPI JSON spec — machine-readable, importable into Postman / Insomnia
router.get('/openapi.json', (req, res) => {
  res.json(spec);
});

// Swagger UI — served via CDN, no npm dependency needed
router.get('/', (req, res) => {
  const specUrl = `${req.protocol}://${req.get('host')}/api/docs/openapi.json`;
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>charno.net API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body { margin: 0; }
    .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '${specUrl}',
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
      layout: 'BaseLayout',
      deepLinking: true,
      persistAuthorization: true,
    });
  </script>
</body>
</html>`);
});

export default router;
