-- Create database
-- CREATE DATABASE charno_web;

-- Connect to database
-- \c charno_web;

-- Content table for i18n strings
CREATE TABLE IF NOT EXISTS content (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) NOT NULL,
  value TEXT NOT NULL,
  language VARCHAR(5) NOT NULL DEFAULT 'en',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(key, language)
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT,
  image_url VARCHAR(500),
  language VARCHAR(5) NOT NULL DEFAULT 'en',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(slug, language)
);

-- Papers table
CREATE TABLE IF NOT EXISTS papers (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  abstract TEXT,
  authors VARCHAR(500),
  keywords VARCHAR(500),
  year INTEGER,
  pdf_url VARCHAR(500),
  language VARCHAR(5) NOT NULL DEFAULT 'en',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Photo galleries table
CREATE TABLE IF NOT EXISTS photos (
  id SERIAL PRIMARY KEY,
  gallery_name VARCHAR(255) NOT NULL,
  gallery_category VARCHAR(50), -- places, events, things
  gallery_description TEXT,
  title VARCHAR(255),
  image_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  description TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  taken_date DATE,
  display_order INTEGER DEFAULT 0,
  language VARCHAR(5) NOT NULL DEFAULT 'en',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blog posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id SERIAL PRIMARY KEY,
  page_name VARCHAR(255) NOT NULL,
  title VARCHAR(500),
  content TEXT NOT NULL,
  language VARCHAR(5) NOT NULL DEFAULT 'en',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(page_name, language)
);

-- CV sections table
CREATE TABLE IF NOT EXISTS cv_sections (
  id SERIAL PRIMARY KEY,
  section_type VARCHAR(50) NOT NULL, -- education, experience, skills, etc.
  title VARCHAR(255),
  organization VARCHAR(255),
  location VARCHAR(255),
  start_date DATE,
  end_date DATE,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  language VARCHAR(5) NOT NULL DEFAULT 'en',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ROM games table
-- One row per game (deduplicated by console + cleaned title).
-- filenames is a JSONB array of raw ROM filenames/directory names on disk.
CREATE TABLE IF NOT EXISTS rom_games (
  id SERIAL PRIMARY KEY,
  console VARCHAR(100) NOT NULL,
  title_key VARCHAR(500) NOT NULL,   -- normalised title used for deduplication (e.g. "Arkanoid")
  filenames JSONB NOT NULL DEFAULT '[]', -- raw filenames on disk (e.g. ["Arkanoid (World).zip", "arkanoid.zip"])
  title VARCHAR(500),                -- display title; may be updated by scraper
  description TEXT,
  year INTEGER,
  box_art_url VARCHAR(500),
  screenshots JSONB DEFAULT '[]',
  tags JSONB DEFAULT '[]',
  available BOOLEAN DEFAULT true,
  hidden BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  scrape_attempted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(console, title_key)
);

-- ── Migrations for existing installs ──────────────────────────────────────────

-- Add hidden column if upgrading from older schema
ALTER TABLE rom_games ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT false;

-- Add scrape_attempted_at if upgrading from older schema
ALTER TABLE rom_games ADD COLUMN IF NOT EXISTS scrape_attempted_at TIMESTAMP WITH TIME ZONE;

-- Add new columns for the one-game-per-title refactor
ALTER TABLE rom_games ADD COLUMN IF NOT EXISTS title_key VARCHAR(500);
ALTER TABLE rom_games ADD COLUMN IF NOT EXISTS filenames JSONB;

-- Data migration: populate title_key + filenames from the old filename column,
-- then merge duplicate (console, title_key) pairs into a single row.
-- The SQL approximates cleanRomTitle(): strip extension, remove (xxx)/[xxx] tags,
-- replace underscores with spaces, collapse whitespace.
DO $$
BEGIN
  -- Only run if old-style rows exist (filename column present and title_key not yet set)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rom_games' AND column_name = 'filename'
  ) AND EXISTS (
    SELECT 1 FROM rom_games WHERE title_key IS NULL LIMIT 1
  ) THEN

    -- Step 1: compute title_key and seed filenames for every existing row
    UPDATE rom_games SET
      title_key = TRIM(
        regexp_replace(
          regexp_replace(
            regexp_replace(
              regexp_replace(filename, '\.[^.]+$', ''),   -- strip extension
              '[[:space:]]*\([^)]*\)', '', 'g'            -- remove (xxx)
            ),
            '[[:space:]]*\[[^]]*\]', '', 'g'             -- remove [xxx]
          ),
          '[[:space:]_]+', ' ', 'g'                      -- underscores/spaces → single space
        )
      ),
      filenames = jsonb_build_array(filename)
    WHERE title_key IS NULL;

    -- Ensure title_key is never empty (fallback to filename without extension)
    UPDATE rom_games SET
      title_key = regexp_replace(filename, '\.[^.]+$', '')
    WHERE title_key = '' OR title_key IS NULL;

    -- Step 2: for each duplicate (console, title_key) group, pick the row with the
    -- most scraped metadata as the survivor and merge all filenames onto it.
    WITH winner AS (
      -- Highest metadata score wins; break ties by earliest id
      SELECT DISTINCT ON (console, title_key)
        id,
        console,
        title_key
      FROM rom_games
      ORDER BY
        console, title_key,
        (CASE WHEN box_art_url  IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN description  IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN year         IS NOT NULL THEN 1 ELSE 0 END) DESC,
        id ASC
    ),
    merged_filenames AS (
      -- Collect every filename for each (console, title_key) group
      SELECT console, title_key, jsonb_agg(DISTINCT f ORDER BY f) AS all_filenames
      FROM rom_games,
           LATERAL jsonb_array_elements_text(filenames) AS f
      GROUP BY console, title_key
    )
    UPDATE rom_games r
    SET filenames = mf.all_filenames
    FROM winner w
    JOIN merged_filenames mf ON mf.console = w.console AND mf.title_key = w.title_key
    WHERE r.id = w.id;

    -- Step 3: delete the losing duplicates
    DELETE FROM rom_games
    WHERE id NOT IN (
      SELECT DISTINCT ON (console, title_key) id
      FROM rom_games
      ORDER BY
        console, title_key,
        (CASE WHEN box_art_url  IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN description  IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN year         IS NOT NULL THEN 1 ELSE 0 END) DESC,
        id ASC
    );

  END IF;
END $$;

-- Add new unique constraint (safe now that duplicates are removed)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rom_games_console_title_key_key'
  ) THEN
    ALTER TABLE rom_games ADD CONSTRAINT rom_games_console_title_key_key UNIQUE (console, title_key);
  END IF;
END $$;

-- Set NOT NULL on the new columns now that they are populated
ALTER TABLE rom_games ALTER COLUMN title_key SET NOT NULL;
ALTER TABLE rom_games ALTER COLUMN filenames SET NOT NULL;
ALTER TABLE rom_games ALTER COLUMN filenames SET DEFAULT '[]';

-- Drop the old single-filename column and its unique constraint
ALTER TABLE rom_games DROP CONSTRAINT IF EXISTS rom_games_filename_console_key;
ALTER TABLE rom_games DROP COLUMN IF EXISTS filename;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rom_games_console ON rom_games(console);
CREATE INDEX IF NOT EXISTS idx_rom_games_available ON rom_games(available);
CREATE INDEX IF NOT EXISTS idx_rom_games_hidden ON rom_games(hidden);
CREATE INDEX IF NOT EXISTS idx_rom_games_title ON rom_games(title);
CREATE INDEX IF NOT EXISTS idx_rom_games_title_key ON rom_games(title_key);

CREATE INDEX idx_content_language ON content(language);
CREATE INDEX idx_projects_language ON projects(language);
CREATE INDEX idx_papers_year ON papers(year DESC);
CREATE INDEX idx_photos_gallery ON photos(gallery_name);
CREATE INDEX idx_blog_posts_page ON blog_posts(page_name);
CREATE INDEX idx_cv_sections_type ON cv_sections(section_type);

-- Create update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update triggers to all tables
CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_papers_updated_at BEFORE UPDATE ON papers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_photos_updated_at BEFORE UPDATE ON photos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cv_sections_updated_at BEFORE UPDATE ON cv_sections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rom_games_updated_at BEFORE UPDATE ON rom_games
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
