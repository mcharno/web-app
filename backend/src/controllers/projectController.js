import { loadJSON, findById } from '../utils/contentLoader.js';

export const getAllProjects = async (req, res) => {
  try {
    const { language = 'en' } = req.query;
    const projects = await loadJSON(language, 'projects');

    // Sort by display_order
    const sorted = projects.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

    res.json(sorted);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const { language = 'en' } = req.query;
    const project = await findById(language, 'projects', id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
