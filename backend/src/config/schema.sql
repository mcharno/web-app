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

-- Create indexes for better performance
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
