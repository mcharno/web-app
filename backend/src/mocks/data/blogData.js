// Mock data for blog_posts table
export const mockBlogPosts = [
  {
    id: 1,
    language: 'en',
    page_name: 'welcome-to-my-blog',
    title: 'Welcome to My Blog',
    content: `# Welcome to My Blog

This is my first blog post. I'll be sharing thoughts on archaeology, web development, and technology.

## What to Expect

- Archaeological research updates
- Web development tutorials
- Project showcases
- Personal reflections

Stay tuned for more content!`,
    created_at: new Date('2024-01-15'),
    updated_at: new Date('2024-01-15')
  },
  {
    id: 2,
    language: 'en',
    page_name: 'digital-archaeology-tools',
    title: 'Essential Digital Tools for Archaeologists',
    content: `# Essential Digital Tools for Archaeologists

In modern archaeological research, digital tools have become indispensable...

## GIS Software

Geographic Information Systems are crucial for:
- Site mapping
- Spatial analysis
- Data visualization

## Database Management

Proper data management ensures:
- Data integrity
- Easy retrieval
- Long-term preservation`,
    created_at: new Date('2024-02-10'),
    updated_at: new Date('2024-02-12')
  },
  {
    id: 3,
    language: 'gr',
    title: 'Καλώς ήρθατε στο Ιστολόγιό μου',
    page_name: 'welcome-to-my-blog',
    content: `# Καλώς ήρθατε στο Ιστολόγιό μου

Αυτή είναι η πρώτη μου ανάρτηση. Θα μοιράζομαι σκέψεις για την αρχαιολογία, την ανάπτυξη ιστού και την τεχνολογία.`,
    created_at: new Date('2024-01-15'),
    updated_at: new Date('2024-01-15')
  },
];
