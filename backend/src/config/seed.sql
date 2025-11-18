-- Seed data for charno.net

-- Content (English)
INSERT INTO content (key, value, language) VALUES
('menuAbout', 'about', 'en'),
('menuProjects', 'projects', 'en'),
('menuPapers', 'papers', 'en'),
('menuPhotos', 'photos', 'en'),
('menuBlog', 'blog', 'en'),
('menuDocs', 'docs', 'en'),
('menuCV', 'cv', 'en'),
('homeTitle', 'This is the new home of charno.net', 'en'),
('homeTime', 'The current time in {0} is {1}', 'en'),
('aboutMain', 'This website served as a portal into my academic life at the University of York. It is very much a work in progress with some critical structural updates necessary for the code and content. Those are as follows:', 'en'),
('aboutListItem1', 'Update the main menu to be a bit more dynamic', 'en'),
('aboutListItem2', 'Create a consistent and sensible submenu template for each section', 'en'),
('aboutListItem3', 'Add mapping elements to the Photos section and other random places', 'en'),
('aboutListItem4', 'Properly integrate the JSPWiki engine into the blog section', 'en'),
('aboutListItem5', 'Create a dedicated Sikyon Survey Project section with web mapping and database interfaces', 'en'),
('aboutListItem6', 'Allow Brent Truell''s vision for my webpage to be a reality', 'en'),
('aboutContent1', 'My arrival into this world was marked by the eruption of Mt. St. Helens in 1980. I like to think of it as the earth rejoicing my birth, however, others (particularly geologists) may disagree. I am currently a Graduate Student at the University of York in the Archaeological Information Systems program. My educational and professional background are in mathematics and computers (general Information Technologies) with additional experience in Greek archaeology and surveying. Originally from the lovely Portland, Oregon, I now make my home within of the medieval city walls of York.', 'en'),
('aboutContent2', 'The scope of my courses for the fall covered Electronic Publishing & Digital Archiving, Internet Resources and Information Management & Retrieval. In addition to the course topics I worked on a placement with English Heritage working on the rectification and interpretation of a site in the Yorkshire Wolds.', 'en'),
('aboutContent3', 'For the spring term I will be discovering the wonders of Data Mapping & CAD, Geospatial Data, and Graphics & Visualization. I will also be working on a placement with the North Yorkshire County Council and a Phd student from York mapping fieldwork related to the Wharram Research project. At this time I will also be formulating my disertation topic, which is to be completed next September.', 'en'),
('aboutContent4', 'This website is simply providing a platform for my University related pursuits. I have brought over many items from my personal website, such as my <a href="/cv">CV</a> and pictures from my travels as well as home. Most of you probably came to this site from my personal websites URL which is forwarded to the University of York servers. This is the begining of the synthesis of the websites to create my super, or if you will, uber website chronicling my personal and professional pursuits.', 'en'),
('papersMain', 'The following papers are from various parts of my academic career and ordered in chronological order', 'en'),
('papersTitleHeader', 'Title', 'en'),
('papersAbstractHeader', 'Abstract', 'en'),
('papersDetailsHeader', 'Details', 'en'),
('photosMain', 'These are mostly pictures taken by me unless otherwise noted.', 'en'),
('welcome', 'Welcome', 'en')
ON CONFLICT (key, language) DO NOTHING;

-- Papers (English)
INSERT INTO papers (title, abstract, authors, keywords, year, language) VALUES
('From the Slope of Enlightenment to the Plateau of Productivity: developing linked data at the ADS',
 'Archaeology has seen increasing use of the Web in recent years for data dissemination, and the ADS holds a wide range of datasets from archaeological excavations. However datasets and applications are currently fragmented and isolated. Different terminologies and data structures hinder search and comparison across datasets. Because of these impediments, archaeological data can be hard to reuse and re-examine in the light of evolving research questions and interpretations. In an attempt to address this, the ADS have begun to ingest some of its excavation data into a triple store and expose it as linked data.',
 'Michael Charno, Ceri Binding, Stuart Jeffrey, Doug Tudhope, Keith May',
 'linked open data; semantic web; excavation data; cidoc-crm',
 2013,
 'en'),
('An Interactive Image Using SVG and Ajax in Archaeology',
 'This article explores the use of Scalable Vector Graphics (SVG) and Ajax in the context of an archaeological project. An interactive image on the Web was developed for the Sikyon Survey Project using these technologies. The Sikyon Survey Project and its needs are addressed to provide context for the interactive image, followed by a discussion about the development of the tool itself. Finally, this article looks at the developments of the Sikyon interactive image and the potential for extending it further.',
 'Michael Charno',
 'mapping; web development; svg; ajax',
 2008,
 'en')
ON CONFLICT DO NOTHING;

-- Photo galleries (placeholders - actual photos need to be added)
INSERT INTO photos (gallery_name, gallery_category, gallery_description, title, image_url, display_order, language) VALUES
('alaska', 'places', 'Photos from Alaska', 'Alaska Gallery', '/images/photos/alaska/thumb.jpg', 1, 'en'),
('greece-2001', 'places', 'Photos from Greece 2001', 'Greece 2001', '/images/photos/greece-2001/thumb.jpg', 2, 'en'),
('greece-autumn', 'places', 'Photos from Greece Autumn', 'Greece Autumn', '/images/photos/greece-autumn/thumb.jpg', 3, 'en'),
('jordan', 'places', 'Photos from Jordan', 'Jordan', '/images/photos/jordan/thumb.jpg', 4, 'en'),
('kyrgyzstan', 'places', 'Photos from Kyrgyzstan', 'Kyrgyzstan', '/images/photos/kyrgyzstan/thumb.jpg', 5, 'en'),
('russia', 'places', 'Photos from Russia', 'Russia', '/images/photos/russia/thumb.jpg', 6, 'en'),
('scotland', 'places', 'Photos from Scotland', 'Scotland', '/images/photos/scotland/thumb.jpg', 7, 'en'),
('gambia', 'places', 'Photos from Gambia', 'Gambia', '/images/photos/gambia/thumb.jpg', 8, 'en'),
('europe', 'places', 'Photos from Europe', 'Europe', '/images/photos/europe/thumb.jpg', 9, 'en'),
('oregon', 'places', 'Photos from Oregon', 'Oregon', '/images/photos/oregon/thumb.jpg', 10, 'en'),
('wedding', 'events', 'Wedding photos', 'Wedding', '/images/photos/wedding/thumb.jpg', 1, 'en'),
('2600', 'events', '2600 Meeting photos', '2600 Meeting', '/images/photos/2600/thumb.jpg', 2, 'en'),
('pace-egg', 'events', 'Pace Egg Play', 'Pace Egg', '/images/photos/pace-egg/thumb.jpg', 3, 'en'),
('airplanes', 'things', 'Airplane photos', 'Airplanes', '/images/photos/airplanes/thumb.jpg', 1, 'en'),
('cold-war', 'things', 'Cold War artifacts', 'Cold War', '/images/photos/cold-war/thumb.jpg', 2, 'en'),
('creatures', 'things', 'Creatures and wildlife', 'Creatures', '/images/photos/creatures/thumb.jpg', 3, 'en'),
('landscapes', 'things', 'Landscape photos', 'Landscapes', '/images/photos/landscapes/thumb.jpg', 4, 'en'),
('nights', 'things', 'Night photography', 'Nights', '/images/photos/nights/thumb.jpg', 5, 'en'),
('sunsets', 'things', 'Sunset photos', 'Sunsets', '/images/photos/sunsets/thumb.jpg', 6, 'en')
ON CONFLICT DO NOTHING;

-- Projects (English)
INSERT INTO projects (slug, title, description, language, display_order) VALUES
('sikyon', 'Sikyon Survey Project', 'Archaeological survey project in Sikyon, Greece', 'en', 1),
('ios', 'iOS Development', 'iOS application development projects', 'en', 2),
('lod', 'Linked Open Data', 'Linked Open Data projects and research', 'en', 3),
('cms', 'Collection Management System', 'Museum collection management system development', 'en', 4),
('datacite', 'DataCite', 'DataCite metadata and DOI management', 'en', 5),
('era', 'Englands Rock Art', 'Rock art documentation and visualization', 'en', 6),
('oai', 'Open Archival Initiative', 'OAI-PMH metadata harvesting implementation', 'en', 7),
('stansted', 'Stansted Framework GIS', 'GIS framework for Stansted Airport archaeology', 'en', 8)
ON CONFLICT (slug, language) DO NOTHING;
