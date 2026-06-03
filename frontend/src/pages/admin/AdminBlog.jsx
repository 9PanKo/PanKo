/** PanKo — Admin blog post moderation. */
import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import AdminNotice from '../../components/admin/AdminNotice';

export default function AdminBlog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const loadPosts = async () => {
    setLoading(true);
    setError('');

    const { data: postRows, error: fetchError } = await supabase
      .from('recipe_posts')
      .select('id, title, time, created_at, author_id')
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    const postsData = postRows || [];
    const authorIds = [...new Set(postsData.map((post) => post.author_id).filter(Boolean))];
    const authorNames = new Map();

    if (authorIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', authorIds);

      if (profilesError) {
        setError(profilesError.message);
        setLoading(false);
        return;
      }

      (profiles || []).forEach((profile) => {
        authorNames.set(profile.id, profile.display_name);
      });
    }

    setPosts(
      postsData.map((post) => ({
        ...post,
        authorName: authorNames.get(post.author_id) || 'Unknown author',
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return posts;

    return posts.filter((post) => {
      const title = String(post.title || '').toLowerCase();
      const author = String(post.authorName || '').toLowerCase();
      return title.includes(q) || author.includes(q);
    });
  }, [posts, searchQuery]);

  const handleDelete = async (post) => {
    if (!window.confirm(`Delete blog post "${post.title}"? This cannot be undone.`)) return;

    setDeletingId(post.id);
    const { error: deleteError } = await supabase.from('recipe_posts').delete().eq('id', post.id);
    setDeletingId(null);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setPosts((prev) => prev.filter((row) => row.id !== post.id));
    setNotice(`Deleted blog post "${post.title}".`);
  };

  return (
    <section className="admin-page">
      <div className="admin-page__head">
        <h2>Blog Management</h2>
        <p>Review and remove community recipe blog posts.</p>
      </div>

      <AdminNotice message={notice} onDismiss={() => setNotice('')} />
      {error && <div className="login-error">{error}</div>}

      <div className="admin-toolbar">
        <label className="admin-toolbar__search">
          <Search size={18} strokeWidth={2} aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by title or author…"
            aria-label="Search blog posts"
          />
        </label>
      </div>

      <div className="admin-panel admin-panel--flush">
        {loading ? (
          <p className="admin-table-empty">Loading blog posts…</p>
        ) : filteredPosts.length === 0 ? (
          <p className="admin-table-empty">
            {posts.length === 0 ? 'No blog posts found.' : 'No posts match your search.'}
          </p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Time</th>
                  <th>Posted</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {filteredPosts.map((post) => (
                  <tr key={post.id}>
                    <td data-label="Title">{post.title}</td>
                    <td data-label="Author">{post.authorName || '—'}</td>
                    <td data-label="Time">{post.time || '—'}</td>
                    <td data-label="Posted">
                      {post.created_at
                        ? new Date(post.created_at).toLocaleDateString()
                        : '—'}
                    </td>
                    <td data-label="Actions">
                      <button
                        type="button"
                        className="btn btn--secondary admin-table__btn admin-table__btn--danger"
                        disabled={deletingId === post.id}
                        onClick={() => handleDelete(post)}
                      >
                        {deletingId === post.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
