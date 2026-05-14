const spec = {
  openapi: '3.0.3',
  info: {
    title: 'charno.net API',
    version: '1.0.0',
    description: [
      'REST API for charno.net.',
      '',
      'Read endpoints are public. Write endpoints require a Bearer token',
      '(`Authorization: Bearer <API_KEY>`).',
      '',
      'Base URL: `https://charno.net/api`',
    ].join('\n'),
  },
  servers: [
    { url: 'https://charno.net/api', description: 'Production' },
    { url: 'http://localhost:3080/api', description: 'Local development' },
  ],
  tags: [
    { name: 'System',   description: 'Health and metrics' },
    { name: 'Content',  description: 'Localised site content (en/gr)' },
    { name: 'Projects', description: 'Personal and professional projects' },
    { name: 'Photos',   description: 'Photo galleries' },
    { name: 'Papers',   description: 'Academic papers and publications' },
    { name: 'Blog',     description: 'Blog posts' },
    { name: 'Comics',   description: 'Comic book collection' },
    { name: 'Berbatis', description: 'Berbatis show poster archive' },
    { name: 'ROMs',     description: 'Retro game ROM library' },
    { name: 'ROM Admin',description: 'ROM management operations (require auth)' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        description: 'API key set via the `API_KEY` environment variable on the server.',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Record "foo" not found' },
        },
      },
      Comic: {
        type: 'object',
        required: ['id', 'title'],
        properties: {
          id:          { type: 'string', example: 'spider-man' },
          title:       { type: 'string', example: 'Spider-Man' },
          publisher:   { type: 'string', example: 'Marvel' },
          volume:      { type: 'string', nullable: true, example: '2' },
          issues:      { type: 'array', items: { type: 'string' }, example: ['1', '14', '24'] },
          cover_image: { type: 'string', nullable: true, example: '/images/comics/spider-man.jpg' },
        },
      },
      ComicInput: {
        type: 'object',
        required: ['title'],
        properties: {
          id:          { type: 'string', description: 'Optional. Auto-generated from title if omitted.' },
          title:       { type: 'string', example: 'Spider-Man' },
          publisher:   { type: 'string', example: 'Marvel' },
          volume:      { type: 'string', nullable: true, example: '2' },
          issues:      { type: 'array', items: { type: 'string' }, example: ['1', '14'] },
          cover_image: { type: 'string', nullable: true },
        },
      },
      ComicPatch: {
        type: 'object',
        description: 'All fields optional. Only supplied fields are updated.',
        properties: {
          title:       { type: 'string' },
          publisher:   { type: 'string' },
          volume:      { type: 'string', nullable: true },
          issues:      { type: 'array', items: { type: 'string' } },
          cover_image: { type: 'string', nullable: true },
        },
      },
      BerbatisShow: {
        type: 'object',
        properties: {
          id:           { type: 'string' },
          headliner:    { type: 'string', example: 'Modest Mouse' },
          support_acts: { type: 'array', items: { type: 'string' } },
          date_display: { type: 'string', example: 'March 14, 2003' },
          date_year:    { type: 'integer', example: 2003 },
          poster_url:   { type: 'string', nullable: true },
          notes:        { type: 'string', nullable: true },
          keywords:     { type: 'array', items: { type: 'string' } },
        },
      },
      Rom: {
        type: 'object',
        properties: {
          id:          { type: 'integer' },
          title:       { type: 'string', example: 'Sonic the Hedgehog' },
          console:     { type: 'string', example: 'genesis' },
          description: { type: 'string', nullable: true },
          year:        { type: 'integer', nullable: true },
          box_art_url: { type: 'string', nullable: true },
          screenshots: { type: 'array', items: { type: 'string' } },
          tags:        { type: 'array', items: { type: 'string' } },
          hidden:      { type: 'boolean' },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: 'Missing or invalid API key.',
        content: { 'application/json': { schema: { '$ref': '#/components/schemas/Error' } } },
      },
      NotFound: {
        description: 'Resource not found.',
        content: { 'application/json': { schema: { '$ref': '#/components/schemas/Error' } } },
      },
    },
  },
  paths: {

    // ── System ──────────────────────────────────────────────────────────────

    '/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        responses: {
          200: {
            description: 'Server is running.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status:  { type: 'string', example: 'ok' },
                    message: { type: 'string', example: 'Server is running' },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ── Content ─────────────────────────────────────────────────────────────

    '/content/{language}': {
      get: {
        tags: ['Content'],
        summary: 'Get all localised content',
        parameters: [
          { name: 'language', in: 'path', required: true, schema: { type: 'string', enum: ['en', 'gr'] } },
        ],
        responses: {
          200: { description: 'Content object for the requested language.' },
        },
      },
    },
    '/content/{language}/{key}': {
      get: {
        tags: ['Content'],
        summary: 'Get a single content key',
        parameters: [
          { name: 'language', in: 'path', required: true, schema: { type: 'string', enum: ['en', 'gr'] } },
          { name: 'key', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Content value for the key.' },
          404: { '$ref': '#/components/responses/NotFound' },
        },
      },
    },

    // ── Projects ─────────────────────────────────────────────────────────────

    '/projects': {
      get: {
        tags: ['Projects'],
        summary: 'List all projects',
        parameters: [
          { name: 'language', in: 'query', schema: { type: 'string', enum: ['en', 'gr'], default: 'en' } },
        ],
        responses: { 200: { description: 'Array of projects.' } },
      },
    },
    '/projects/{id}': {
      get: {
        tags: ['Projects'],
        summary: 'Get project by ID',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'language', in: 'query', schema: { type: 'string', enum: ['en', 'gr'], default: 'en' } },
        ],
        responses: {
          200: { description: 'Project object.' },
          404: { '$ref': '#/components/responses/NotFound' },
        },
      },
    },

    // ── Photos ───────────────────────────────────────────────────────────────

    '/photos/galleries': {
      get: {
        tags: ['Photos'],
        summary: 'List all photo galleries',
        parameters: [
          { name: 'language', in: 'query', schema: { type: 'string', enum: ['en', 'gr'], default: 'en' } },
        ],
        responses: { 200: { description: 'Array of gallery metadata.' } },
      },
    },
    '/photos/gallery/{name}': {
      get: {
        tags: ['Photos'],
        summary: 'Get photos in a gallery',
        parameters: [
          { name: 'name', in: 'path', required: true, schema: { type: 'string', example: 'cricket' } },
          { name: 'language', in: 'query', schema: { type: 'string', enum: ['en', 'gr'], default: 'en' } },
        ],
        responses: {
          200: { description: 'Array of photos in the gallery.' },
          404: { '$ref': '#/components/responses/NotFound' },
        },
      },
    },
    '/photos': {
      get: {
        tags: ['Photos'],
        summary: 'List all photos across all galleries',
        parameters: [
          { name: 'language', in: 'query', schema: { type: 'string', enum: ['en', 'gr'], default: 'en' } },
        ],
        responses: { 200: { description: 'Array of all photos.' } },
      },
    },
    '/photos/{id}': {
      get: {
        tags: ['Photos'],
        summary: 'Get a photo by ID',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Photo object.' },
          404: { '$ref': '#/components/responses/NotFound' },
        },
      },
    },

    // ── Papers ────────────────────────────────────────────────────────────────

    '/papers': {
      get: {
        tags: ['Papers'],
        summary: 'List all papers',
        parameters: [
          { name: 'language', in: 'query', schema: { type: 'string', enum: ['en', 'gr'], default: 'en' } },
        ],
        responses: { 200: { description: 'Array of papers.' } },
      },
    },
    '/papers/{id}': {
      get: {
        tags: ['Papers'],
        summary: 'Get a paper by ID',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'language', in: 'query', schema: { type: 'string', enum: ['en', 'gr'], default: 'en' } },
        ],
        responses: {
          200: { description: 'Paper object.' },
          404: { '$ref': '#/components/responses/NotFound' },
        },
      },
    },

    // ── Blog ──────────────────────────────────────────────────────────────────

    '/blog': {
      get: {
        tags: ['Blog'],
        summary: 'List all blog posts',
        parameters: [
          { name: 'language', in: 'query', schema: { type: 'string', enum: ['en', 'gr'], default: 'en' } },
        ],
        responses: { 200: { description: 'Array of blog post summaries.' } },
      },
    },
    '/blog/{page}': {
      get: {
        tags: ['Blog'],
        summary: 'Get a blog post by slug',
        parameters: [
          { name: 'page', in: 'path', required: true, schema: { type: 'string', example: 'hello-world' } },
          { name: 'language', in: 'query', schema: { type: 'string', enum: ['en', 'gr'], default: 'en' } },
        ],
        responses: {
          200: { description: 'Blog post with rendered content.' },
          404: { '$ref': '#/components/responses/NotFound' },
        },
      },
    },

    // ── Comics ────────────────────────────────────────────────────────────────

    '/comics/publishers': {
      get: {
        tags: ['Comics'],
        summary: 'List all publishers',
        responses: {
          200: {
            description: 'Sorted list of unique publishers.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    publishers: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/comics': {
      get: {
        tags: ['Comics'],
        summary: 'List comics',
        parameters: [
          { name: 'publisher', in: 'query', schema: { type: 'string' }, description: 'Filter by publisher name.' },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search title or publisher.' },
        ],
        responses: {
          200: {
            description: 'Sorted array of comics plus total count.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    comics: { type: 'array', items: { '$ref': '#/components/schemas/Comic' } },
                    total:  { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Comics'],
        summary: 'Create a comic',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { '$ref': '#/components/schemas/ComicInput' } } },
        },
        responses: {
          201: {
            description: 'Created comic.',
            content: { 'application/json': { schema: { '$ref': '#/components/schemas/Comic' } } },
          },
          400: { description: 'Validation error — title is required.' },
          401: { '$ref': '#/components/responses/Unauthorized' },
          409: { description: 'A comic with that ID already exists.' },
        },
      },
    },
    '/comics/{id}': {
      get: {
        tags: ['Comics'],
        summary: 'Get a comic by ID',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', example: 'spider-man' } },
        ],
        responses: {
          200: { description: 'Comic object.', content: { 'application/json': { schema: { '$ref': '#/components/schemas/Comic' } } } },
          404: { '$ref': '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['Comics'],
        summary: 'Replace a comic (full update)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { '$ref': '#/components/schemas/ComicInput' } } },
        },
        responses: {
          200: { description: 'Updated comic.', content: { 'application/json': { schema: { '$ref': '#/components/schemas/Comic' } } } },
          401: { '$ref': '#/components/responses/Unauthorized' },
          404: { '$ref': '#/components/responses/NotFound' },
        },
      },
      patch: {
        tags: ['Comics'],
        summary: 'Update a comic (partial)',
        description: 'Only the supplied fields are updated. Omitted fields retain their current values.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { '$ref': '#/components/schemas/ComicPatch' } } },
        },
        responses: {
          200: { description: 'Updated comic.', content: { 'application/json': { schema: { '$ref': '#/components/schemas/Comic' } } } },
          401: { '$ref': '#/components/responses/Unauthorized' },
          404: { '$ref': '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Comics'],
        summary: 'Delete a comic',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Deleted comic returned for confirmation.' },
          401: { '$ref': '#/components/responses/Unauthorized' },
          404: { '$ref': '#/components/responses/NotFound' },
        },
      },
    },

    // ── Berbatis ──────────────────────────────────────────────────────────────

    '/berbatis': {
      get: {
        tags: ['Berbatis'],
        summary: 'List shows',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search headliner, support acts, date, or keywords.' },
        ],
        responses: {
          200: {
            description: 'Array of shows sorted by year descending.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    shows: { type: 'array', items: { '$ref': '#/components/schemas/BerbatisShow' } },
                    total: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/berbatis/{id}': {
      get: {
        tags: ['Berbatis'],
        summary: 'Get a show by ID',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Show object.', content: { 'application/json': { schema: { '$ref': '#/components/schemas/BerbatisShow' } } } },
          404: { '$ref': '#/components/responses/NotFound' },
        },
      },
    },

    // ── ROMs ──────────────────────────────────────────────────────────────────

    '/roms/consoles': {
      get: {
        tags: ['ROMs'],
        summary: 'List available consoles',
        responses: { 200: { description: 'Array of console identifiers.' } },
      },
    },
    '/roms/tags': {
      get: {
        tags: ['ROMs'],
        summary: 'List all tags',
        responses: { 200: { description: 'Array of tag strings for autocomplete.' } },
      },
    },
    '/roms': {
      get: {
        tags: ['ROMs'],
        summary: 'List ROMs',
        parameters: [
          { name: 'console', in: 'query', schema: { type: 'string' }, description: 'Filter by console.' },
          { name: 'search',  in: 'query', schema: { type: 'string' }, description: 'Search by title.' },
          { name: 'tags',    in: 'query', schema: { type: 'array', items: { type: 'string' } }, description: 'Filter by tags (repeated param: tags=A&tags=B).' },
        ],
        responses: { 200: { description: 'Array of ROM entries.' } },
      },
    },
    '/roms/{id}': {
      get: {
        tags: ['ROMs'],
        summary: 'Get a ROM by ID',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          200: { description: 'ROM object.', content: { 'application/json': { schema: { '$ref': '#/components/schemas/Rom' } } } },
          404: { '$ref': '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['ROMs'],
        summary: 'Replace ROM metadata (full update)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        requestBody: { required: true, content: { 'application/json': { schema: { '$ref': '#/components/schemas/Rom' } } } },
        responses: {
          200: { description: 'Updated ROM.' },
          401: { '$ref': '#/components/responses/Unauthorized' },
          404: { '$ref': '#/components/responses/NotFound' },
        },
      },
      patch: {
        tags: ['ROMs'],
        summary: 'Update ROM metadata (partial)',
        description: 'Accepts any combination of: title, description, year, box_art_url, screenshots, tags, display_order, hidden.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: {
          200: { description: 'Updated ROM.' },
          401: { '$ref': '#/components/responses/Unauthorized' },
          404: { '$ref': '#/components/responses/NotFound' },
        },
      },
    },

    // ── ROM Admin ─────────────────────────────────────────────────────────────

    '/roms/scan': {
      post: {
        tags: ['ROM Admin'],
        summary: 'Scan filesystem for new ROMs',
        description: 'Walks the configured ROM directory and inserts new entries into the database.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Scan complete. Returns count of new entries added.' },
          401: { '$ref': '#/components/responses/Unauthorized' },
        },
      },
    },
    '/roms/scrape-unscraped': {
      post: {
        tags: ['ROM Admin'],
        summary: 'Scrape metadata for all un-scraped ROMs via IGDB',
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50, maximum: 100 }, description: 'Max ROMs to scrape in one call.' },
        ],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Scrape results.' },
          401: { '$ref': '#/components/responses/Unauthorized' },
        },
      },
    },
    '/roms/merge': {
      post: {
        tags: ['ROM Admin'],
        summary: 'Manually merge ROM entries',
        description: 'Merge multiple ROM rows into one. Useful when duplicates exist for the same game.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['ids'],
                properties: {
                  ids:     { type: 'array', items: { type: 'integer' }, description: 'IDs to merge.' },
                  keep_id: { type: 'integer', description: 'ID of the row to keep metadata from. Defaults to lowest ID.' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Merged ROM.' },
          401: { '$ref': '#/components/responses/Unauthorized' },
        },
      },
    },
    '/roms/merge-by-title': {
      post: {
        tags: ['ROM Admin'],
        summary: 'Merge ROMs sharing the same title key',
        description: 'Useful after scraping arcade/MAME where filenames are opaque IDs that resolve to the same game.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'console', in: 'query', schema: { type: 'string' }, description: 'Limit to a specific console.' },
        ],
        responses: {
          200: { description: 'Merge results.' },
          401: { '$ref': '#/components/responses/Unauthorized' },
        },
      },
    },
    '/roms/split-mismerged': {
      post: {
        tags: ['ROM Admin'],
        summary: 'Split incorrectly merged ROM rows',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'console', in: 'query', schema: { type: 'string' }, description: 'Limit to a specific console.' },
        ],
        responses: {
          200: { description: 'Split results.' },
          401: { '$ref': '#/components/responses/Unauthorized' },
        },
      },
    },
    '/roms/{id}/scrape': {
      post: {
        tags: ['ROM Admin'],
        summary: 'Scrape metadata from ScreenScraper URLs',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Scrape result.' },
          401: { '$ref': '#/components/responses/Unauthorized' },
          404: { '$ref': '#/components/responses/NotFound' },
        },
      },
    },
    '/roms/{id}/auto-scrape': {
      post: {
        tags: ['ROM Admin'],
        summary: 'Auto-scrape via ScreenScraper (server-side)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Scrape result.' },
          401: { '$ref': '#/components/responses/Unauthorized' },
          404: { '$ref': '#/components/responses/NotFound' },
        },
      },
    },
    '/roms/{id}/auto-scrape-igdb': {
      post: {
        tags: ['ROM Admin'],
        summary: 'Auto-scrape via IGDB',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Scrape result.' },
          401: { '$ref': '#/components/responses/Unauthorized' },
          404: { '$ref': '#/components/responses/NotFound' },
        },
      },
    },
    '/roms/{id}/split': {
      post: {
        tags: ['ROM Admin'],
        summary: 'Split a merged ROM back into individual rows',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Split result.' },
          401: { '$ref': '#/components/responses/Unauthorized' },
          404: { '$ref': '#/components/responses/NotFound' },
        },
      },
    },
    '/roms/{id}/debug-scrape': {
      post: {
        tags: ['ROM Admin'],
        summary: 'Dry-run scrape (returns raw API responses, does not save)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Raw scraper API responses.' },
          401: { '$ref': '#/components/responses/Unauthorized' },
          404: { '$ref': '#/components/responses/NotFound' },
        },
      },
    },
  },
};

export default spec;
