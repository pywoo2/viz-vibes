'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { posts, getPostContent, type Post } from '../lib/posts';

interface BlogViewProps {
  onClose: () => void;
}

export default function BlogView({ onClose }: BlogViewProps) {
  const [activePost, setActivePost] = useState<Post | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activePost) return;
    setLoading(true);
    getPostContent(activePost.slug)
      .then(setContent)
      .catch(() => setContent('Failed to load post.'))
      .finally(() => setLoading(false));
  }, [activePost]);

  return (
    <div className="blog-view">
      <div className="blog-header">
        {activePost ? (
          <button className="blog-back" onClick={() => setActivePost(null)}>
            &larr; back
          </button>
        ) : (
          <h1 className="blog-title">blog</h1>
        )}
        <button className="blog-close" onClick={onClose}>&times;</button>
      </div>

      <div className="blog-content">
        {activePost ? (
          loading ? (
            <p className="blog-loading">loading...</p>
          ) : (
            <article className="blog-article">
              <div className="blog-post-meta">
                <time>{activePost.date}</time>
              </div>
              <ReactMarkdown>{content}</ReactMarkdown>
            </article>
          )
        ) : (
          <ul className="blog-post-list">
            {posts.map((post) => (
              <li key={post.slug}>
                <button
                  className="blog-post-item"
                  onClick={() => setActivePost(post)}
                >
                  <span className="blog-post-item-title">{post.title}</span>
                  <span className="blog-post-item-date">{post.date}</span>
                  <span className="blog-post-item-desc">{post.description}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
