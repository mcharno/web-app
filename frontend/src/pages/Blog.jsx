import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { blogAPI } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import './Blog.css';

const Blog = () => {
  const [searchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [currentPost, setCurrentPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();
  const page = searchParams.get('page');

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (page) {
          const response = await blogAPI.getByPage(page, language);
          setCurrentPost(response.data);
        } else {
          const response = await blogAPI.getAll(language);
          setPosts(response.data);
        }
      } catch (error) {
        console.error('Error fetching blog:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page, language]);

  if (loading) return <div>Loading...</div>;

  if (currentPost) {
    return (
      <div className="blog-page">
        <h2>{currentPost.title || currentPost.page_name}</h2>
        <div
          className="blog-content"
          dangerouslySetInnerHTML={{ __html: currentPost.content }}
        />
      </div>
    );
  }

  return (
    <div className="blog-page">
      <h2>Blog</h2>
      <div className="posts-list">
        {posts.map((post) => (
          <div key={post.id} className="post-card">
            <h3>
              <a href={`/blog?page=${post.page_name}`}>
                {post.title || post.page_name}
              </a>
            </h3>
            <div className="post-meta">
              <span>{new Date(post.updated_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Blog;
