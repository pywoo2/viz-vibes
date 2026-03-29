'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { posts, type Post } from '../lib/posts';
import type { ExtendedRecordMap } from 'notion-types';

const NotionRenderer = lazy(() =>
  import('react-notion-x').then((mod) => ({ default: mod.NotionRenderer }))
);

import 'react-notion-x/src/styles.css';

export default function BlogView() {
  const [activePost, setActivePost] = useState<Post | null>(null);
  const [recordMap, setRecordMap] = useState<ExtendedRecordMap | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activePost) {
      setRecordMap(null);
      return;
    }
    setLoading(true);
    fetch(`/api/notion?pageId=${activePost.notionId}`)
      .then((r) => r.json())
      .then((data) => setRecordMap(data))
      .catch(() => setRecordMap(null))
      .finally(() => setLoading(false));
  }, [activePost]);

  return (
    <div className="blog-view">
      <div className="blog-content">
        {activePost && (
          <button className="blog-back" onClick={() => setActivePost(null)}>
            &larr; back
          </button>
        )}
        {activePost ? (
          loading ? (
            <p className="blog-loading">loading...</p>
          ) : recordMap ? (
            <div className="notion-page-wrapper">
              <Suspense fallback={<p className="blog-loading">loading...</p>}>
                <NotionRenderer
                  recordMap={recordMap}
                  fullPage={false}
                  darkMode={true}
                  disableHeader={true}
                />
              </Suspense>
            </div>
          ) : (
            <p className="blog-loading">failed to load post.</p>
          )
        ) : (
          <ul className="blog-post-list">
            {posts.map((post) => (
              <li key={post.notionId}>
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
