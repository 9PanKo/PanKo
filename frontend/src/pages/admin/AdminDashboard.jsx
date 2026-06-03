/** PanKo — Admin overview: counts and recent activity. */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { ACCOUNT_STATUS } from '../../utils/accountAccess';

function StatCard({ label, value, icon, hint }) {
  return (
    <article className="admin-stat-card">
      <span className="admin-stat-card__icon" aria-hidden="true">
        <i className={icon} />
      </span>
      <div>
        <p className="admin-stat-card__label">{label}</p>
        <p className="admin-stat-card__value">{value}</p>
        {hint && <p className="admin-stat-card__hint">{hint}</p>}
      </div>
    </article>
  );
}

function weekAgoIso() {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return date.toISOString();
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    recipes: '—',
    users: '—',
    blogPosts: '—',
    suspended: '—',
    newRecipesWeek: '—',
    newUsersWeek: '—',
  });
  const [recentRecipes, setRecentRecipes] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');

      const since = weekAgoIso();

      try {
        const [
          recipesRes,
          usersRes,
          postsRes,
          suspendedRes,
          newRecipesRes,
          newUsersRes,
          recentRecipesRes,
          recentUsersRes,
        ] = await Promise.all([
          supabase.from('recipes').select('id', { count: 'exact', head: true }),
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('recipe_posts').select('id', { count: 'exact', head: true }),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('account_status', ACCOUNT_STATUS.SUSPENDED),
          supabase.from('recipes').select('id', { count: 'exact', head: true }).gte('created_at', since),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', since),
          supabase
            .from('recipes')
            .select('id, title, created_at')
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('profiles')
            .select('id, display_name, email, created_at, account_status')
            .order('created_at', { ascending: false })
            .limit(5),
        ]);

        if (recipesRes.error) throw recipesRes.error;
        if (usersRes.error) throw usersRes.error;
        if (postsRes.error) throw postsRes.error;

        setStats({
          recipes: recipesRes.count ?? 0,
          users: usersRes.count ?? 0,
          blogPosts: postsRes.count ?? 0,
          suspended: suspendedRes.error ? '—' : (suspendedRes.count ?? 0),
          newRecipesWeek: newRecipesRes.error ? '—' : (newRecipesRes.count ?? 0),
          newUsersWeek: newUsersRes.error ? '—' : (newUsersRes.count ?? 0),
        });

        setRecentRecipes(recentRecipesRes.error ? [] : recentRecipesRes.data || []);
        setRecentUsers(recentUsersRes.error ? [] : recentUsersRes.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard stats');
      }

      setLoading(false);
    };

    load();
  }, []);

  return (
    <section className="admin-page">
      <div className="admin-page__head">
        <h2>Dashboard Overview</h2>
        <p>Platform health, growth this week, and recent activity.</p>
      </div>

      {error && <div className="login-error">{error}</div>}

      <div className="admin-stat-grid admin-stat-grid--six">
        <StatCard
          label="Total recipes"
          value={loading ? '…' : stats.recipes}
          icon="fa-solid fa-book-open"
          hint="Library + user-created recipes"
        />
        <StatCard
          label="Registered users"
          value={loading ? '…' : stats.users}
          icon="fa-solid fa-users"
          hint="Profiles in Supabase"
        />
        <StatCard
          label="Blog posts"
          value={loading ? '…' : stats.blogPosts}
          icon="fa-solid fa-newspaper"
          hint="Community recipe posts"
        />
        <StatCard
          label="Suspended accounts"
          value={loading ? '…' : stats.suspended}
          icon="fa-solid fa-user-slash"
          hint="Users blocked from the app"
        />
        <StatCard
          label="New recipes (7d)"
          value={loading ? '…' : stats.newRecipesWeek}
          icon="fa-solid fa-plus"
          hint="Created in the last week"
        />
        <StatCard
          label="New users (7d)"
          value={loading ? '…' : stats.newUsersWeek}
          icon="fa-solid fa-user-plus"
          hint="Signed up in the last week"
        />
      </div>

      <div className="admin-dashboard-grid">
        <div className="admin-panel">
          <div className="admin-panel__head">
            <h3>Recent recipes</h3>
            <Link to="/admin/recipes">View all</Link>
          </div>
          {loading ? (
            <p className="admin-list-empty">Loading…</p>
          ) : recentRecipes.length === 0 ? (
            <p className="admin-list-empty">No recipes yet.</p>
          ) : (
            <ul className="admin-activity-list">
              {recentRecipes.map((recipe) => (
                <li key={recipe.id}>
                  <strong>{recipe.title}</strong>
                  <span>{formatDate(recipe.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="admin-panel">
          <div className="admin-panel__head">
            <h3>Recent signups</h3>
            <Link to="/admin/users">View all</Link>
          </div>
          {loading ? (
            <p className="admin-list-empty">Loading…</p>
          ) : recentUsers.length === 0 ? (
            <p className="admin-list-empty">No users yet.</p>
          ) : (
            <ul className="admin-activity-list">
              {recentUsers.map((user) => (
                <li key={user.id}>
                  <div>
                    <strong>{user.display_name || 'Unnamed user'}</strong>
                    <span className="admin-activity-list__sub">
                      {user.email || 'No email on file'}
                    </span>
                  </div>
                  <span>{formatDate(user.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="admin-panel">
        <h3>Quick links</h3>
        <ul className="admin-quick-links">
          <li>
            <Link to="/admin/recipes">Review and manage recipes</Link>
          </li>
          <li>
            <Link to="/admin/users">Manage users and account status</Link>
          </li>
          <li>
            <Link to="/admin/blog">Moderate community blog posts</Link>
          </li>
        </ul>
      </div>
    </section>
  );
}
