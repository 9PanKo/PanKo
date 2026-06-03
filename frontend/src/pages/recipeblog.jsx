/** PanKo — Community recipe blog (likes, saves, comments). */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { ensureProfile } from '../utils/profile';
import { attachProfiles } from '../utils/attachProfiles';
import RecipePostCard from '../components/RecipePostCard';

export default function RecipeBlog({ user, onLibraryChanged, selectedBlogPostId }) {
  const [posts, setPosts] = useState([]);
  const [likes, setLikes] = useState([]);
  const [saves, setSaves] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadBlogData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: postsData, error: postsError } = await supabase
        .from('recipe_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      const { data: likesData, error: likesError } = await supabase
        .from('recipe_post_likes')
        .select('id, post_id, user_id');

      if (likesError) throw likesError;

      let savesData = [];
      if (user) {
        const { data, error: savesError } = await supabase
          .from('recipe_post_saves')
          .select('post_id')
          .eq('user_id', user.id);
        if (savesError) throw savesError;
        savesData = data || [];
      }

      const { data: commentsData, error: commentsError } = await supabase
        .from('recipe_post_comments')
        .select('id, post_id, user_id, content, created_at')
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      const postsWithAuthors = await attachProfiles(postsData || [], {
        userIdKey: 'author_id',
        profileKey: 'profiles',
      });
      const commentsWithAuthors = await attachProfiles(commentsData || [], {
        userIdKey: 'user_id',
        profileKey: 'profiles',
      });

      setPosts(postsWithAuthors);
      setLikes(likesData || []);
      setSaves(savesData.map((s) => s.post_id));
      setComments(commentsWithAuthors);
    } catch (err) {
      setError(err.message || 'Failed to load blog');
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) ensureProfile(user);
    loadBlogData();
  }, [user, loadBlogData]);

  useEffect(() => {
    if (!selectedBlogPostId) return;
    if (loading) return;
    if (!posts?.length) return;

    const el = document.getElementById(`blog-post-${selectedBlogPostId}`);
    if (!el) return;

    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [selectedBlogPostId, loading, posts]);

  const likeCountByPost = useMemo(() => {
    const counts = {};
    likes.forEach((like) => {
      counts[like.post_id] = (counts[like.post_id] || 0) + 1;
    });
    return counts;
  }, [likes]);

  const userLikedPosts = useMemo(() => {
    if (!user) return new Set();
    return new Set(
      likes.filter((l) => l.user_id === user.id).map((l) => l.post_id),
    );
  }, [likes, user]);

  const commentsByPost = useMemo(() => {
    const map = {};
    comments.forEach((c) => {
      if (!map[c.post_id]) map[c.post_id] = [];
      map[c.post_id].push(c);
    });
    return map;
  }, [comments]);

  const topLikedPosts = useMemo(() => {
    return [...posts]
      .map((post) => ({
        post,
        likeCount: likeCountByPost[post.id] || 0,
      }))
      .sort((a, b) => b.likeCount - a.likeCount)
      .filter((item) => item.likeCount > 0)
      .slice(0, 5);
  }, [posts, likeCountByPost]);

  if (loading) {
    return <p className="blog-loading">Loading recipe blog…</p>;
  }

  if (error) {
    return (
      <div className="blog-error">
        <h2>Recipe blog unavailable</h2>
        <p>{error}</p>
        <p className="blog-error__hint">
          Run <code>supabase/blog_schema.sql</code> in your Supabase SQL Editor, then refresh.
        </p>
        <button type="button" className="btn" onClick={loadBlogData}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="recipe-blog">
      <div className="section-topbar section-topbar--stack">
        <header className="recipe-blog__header">
          <h1>Recipe Blog</h1>
          <p>
            Share recipes, discover what others are cooking, and save favorites to your library.
          </p>
        </header>
      </div>

      {topLikedPosts.length > 0 && (
        <section className="blog-top-liked">
          <h2>Most liked recipes</h2>
          <div className="blog-top-liked__grid">
            {topLikedPosts.map(({ post, likeCount }) => (
              <div key={post.id} className="blog-top-liked__card">
                <span className="blog-top-liked__hearts">
                  <i className="fa-solid fa-heart" aria-hidden="true" /> {likeCount}
                </span>
                <h3>{post.title}</h3>
                <p className="blog-top-liked__author">
                  by {post.profiles?.display_name || 'Chef'}
                </p>
                <p className="blog-top-liked__time">⏱ {post.time}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="blog-feed">
        <h2>Community recipes</h2>
        {posts.length === 0 ? (
          <p className="blog-feed__empty">
            No posts yet. Be the first to share a recipe!
          </p>
        ) : (
          <div className="blog-feed__list">
            {posts.map((post) => (
              <RecipePostCard
                key={post.id}
                post={post}
                highlighted={selectedBlogPostId === post.id}
                likeCount={likeCountByPost[post.id] || 0}
                userLiked={userLikedPosts.has(post.id)}
                userSaved={saves.includes(post.id)}
                comments={commentsByPost[post.id] || []}
                currentUserId={user?.id}
                onInteraction={loadBlogData}
                onLibraryChanged={onLibraryChanged}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
