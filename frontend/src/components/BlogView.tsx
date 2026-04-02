'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { posts, type Post } from '../lib/posts';
import type { ExtendedRecordMap } from 'notion-types';

const NotionRenderer = lazy(() =>
  import('react-notion-x').then((mod) => ({ default: mod.NotionRenderer }))
);

import 'react-notion-x/src/styles.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface BlogViewProps {
  initialSlug?: string | null;
  onPostChange?: (slug: string | null) => void;
}

export default function BlogView({ initialSlug, onPostChange }: BlogViewProps) {
  const [activePost, setActivePost] = useState<Post | null>(
    initialSlug ? posts.find((p) => p.slug === initialSlug) ?? null : null
  );
  const [recordMap, setRecordMap] = useState<ExtendedRecordMap | null>(null);
  const [loading, setLoading] = useState(false);

  // Likes
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);

  // Comments
  const [comments, setComments] = useState<{ text: string; name: string; timestamp: string }[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentName, setCommentName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!activePost) {
      setRecordMap(null);
      setLikes(0);
      setLiked(false);
      setComments([]);
      return;
    }
    setLoading(true);
    fetch(`/api/notion?pageId=${activePost.notionId}`)
      .then((r) => r.json())
      .then((data) => setRecordMap(data))
      .catch(() => setRecordMap(null))
      .finally(() => setLoading(false));

    // Load likes
    fetch(`${API_URL}/api/blog/${activePost.slug}/likes`)
      .then((r) => r.json())
      .then((data) => setLikes(data.likes ?? 0))
      .catch(() => {});

    // Load comments
    fetch(`${API_URL}/api/blog/${activePost.slug}/comments`)
      .then((r) => r.json())
      .then((data) => setComments(Array.isArray(data) ? data : []))
      .catch(() => {});

    // Check if already liked this post
    try {
      const likedPosts = JSON.parse(localStorage.getItem('blog-likes') || '{}');
      setLiked(!!likedPosts[activePost.slug]);
    } catch {
      setLiked(false);
    }
  }, [activePost]);

  const handleLike = async () => {
    if (!activePost) return;
    try {
      const res = await fetch(`${API_URL}/api/blog/${activePost.slug}/like`, {
        method: 'POST',
      });
      if (!res.ok) return;
      const data = await res.json();
      setLikes(data.likes ?? likes + 1);
      setLiked(true);
      const likedPosts = JSON.parse(localStorage.getItem('blog-likes') || '{}');
      likedPosts[activePost.slug] = true;
      localStorage.setItem('blog-likes', JSON.stringify(likedPosts));
    } catch {}
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePost || !commentText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/blog/${activePost.slug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: commentText.trim(), name: commentName.trim() || 'anonymous' }),
      });
      if (!res.ok) return;
      const newComment = await res.json();
      setComments((prev) => [...prev, newComment]);
      setCommentText('');
    } catch {}
    setSubmitting(false);
  };

  const openPost = (post: Post) => {
    setActivePost(post);
    onPostChange?.(post.slug);
  };

  const closePost = () => {
    setActivePost(null);
    onPostChange?.(null);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="blog-view">
      <div className="blog-content">
        {activePost && (
          <button className="blog-back" onClick={closePost}>
            &larr; back
          </button>
        )}
        {activePost ? (
          loading ? (
            <p className="blog-loading">loading...</p>
          ) : recordMap ? (
            <>
              {/* Like button at top of article */}
              <div className="blog-like-row">
                <button
                  className={`blog-like-btn${liked ? ' blog-like-btn--liked' : ''}`}
                  onClick={handleLike}
                  disabled={liked}
                >
                  {liked ? '\u2665' : '\u2661'} {likes}
                </button>
              </div>

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

              {/* Comments at bottom */}
              <div className="blog-engagement">
                <div className="blog-comments">
                  <h3 className="blog-comments-title">comments</h3>
                  {comments.length === 0 && (
                    <p className="blog-comments-empty">no comments yet — be the first!</p>
                  )}
                  {comments.map((c, i) => (
                    <div key={i} className="blog-comment">
                      <div className="blog-comment-header">
                        <span className="blog-comment-name">{c.name}</span>
                        <span className="blog-comment-date">{formatDate(c.timestamp)}</span>
                      </div>
                      <p className="blog-comment-text">{c.text}</p>
                    </div>
                  ))}

                  <form className="blog-comment-form" onSubmit={handleComment}>
                    <input
                      className="blog-comment-input blog-comment-name-input"
                      type="text"
                      placeholder="name (optional)"
                      value={commentName}
                      onChange={(e) => setCommentName(e.target.value)}
                      maxLength={30}
                    />
                    <textarea
                      className="blog-comment-input blog-comment-textarea"
                      placeholder="leave a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      maxLength={500}
                      rows={3}
                    />
                    <button
                      className="blog-comment-submit"
                      type="submit"
                      disabled={submitting || !commentText.trim()}
                    >
                      {submitting ? 'posting...' : 'post'}
                    </button>
                  </form>
                </div>
              </div>
            </>
          ) : (
            <p className="blog-loading">failed to load post.</p>
          )
        ) : (
          <ul className="blog-post-list">
            {posts.map((post) => (
              <li key={post.notionId}>
                <button
                  className="blog-post-item"
                  onClick={() => openPost(post)}
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
