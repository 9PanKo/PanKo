/** PanKo — Admin user list: status, suspend, admin flag. */
import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import {
  ACCOUNT_STATUS,
  accountStatusLabel,
  normalizeAccountStatus,
} from '../../utils/accountAccess';

import AdminNotice from '../../components/admin/AdminNotice';

function countRecipesByUser(recipes) {
  const counts = new Map();
  recipes.forEach((recipe) => {
    if (!recipe?.user_id) return;
    counts.set(recipe.user_id, (counts.get(recipe.user_id) || 0) + 1);
  });
  return counts;
}

function matchesUserSearch(profile, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const name = String(profile.display_name || '').toLowerCase();
  const email = String(profile.email || '').toLowerCase();
  const status = accountStatusLabel(profile.account_status).toLowerCase();
  const statusValue = normalizeAccountStatus(profile.account_status);

  return (
    name.includes(q) ||
    email.includes(q) ||
    status.includes(q) ||
    statusValue.includes(q)
  );
}

function UserStatusToggle({ profile, disabled, saving, onToggle }) {
  const isActive = normalizeAccountStatus(profile.account_status) === ACCOUNT_STATUS.ACTIVE;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isActive}
      aria-label={`Set ${profile.display_name} to ${isActive ? 'suspended' : 'active'}`}
      className={`admin-status-toggle${isActive ? ' admin-status-toggle--active' : ' admin-status-toggle--suspended'}`}
      disabled={disabled || saving}
      onClick={onToggle}
    >
      <span className="admin-status-toggle__track" aria-hidden="true">
        <span className="admin-status-toggle__thumb" />
      </span>
      <span className="admin-status-toggle__label">{accountStatusLabel(profile.account_status)}</span>
    </button>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    setError('');

    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUserId(user?.id ?? null);

    const profilesRes = await supabase
      .from('profiles')
      .select('id, display_name, email, account_status, is_admin, created_at')
      .order('created_at', { ascending: false });

    let profiles = profilesRes.data;
    if (profilesRes.error) {
      const fallback = await supabase
        .from('profiles')
        .select('id, display_name, account_status, is_admin, created_at')
        .order('created_at', { ascending: false });
      if (fallback.error) {
        setError(fallback.error.message);
        setLoading(false);
        return;
      }
      profiles = fallback.data;
    }

    const recipesRes = await supabase.from('recipes').select('user_id');
    if (recipesRes.error) {
      setError(recipesRes.error.message);
      setLoading(false);
      return;
    }

    const recipeCounts = countRecipesByUser(recipesRes.data || []);
    const rows = (profiles || []).map((profile) => ({
      ...profile,
      account_status: normalizeAccountStatus(profile.account_status),
      savedRecipes: recipeCounts.get(profile.id) || 0,
    }));

    setUsers(rows);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(
    () => users.filter((profile) => matchesUserSearch(profile, searchQuery)),
    [users, searchQuery],
  );

  const toggleAccountStatus = async (profile) => {
    const nextStatus =
      normalizeAccountStatus(profile.account_status) === ACCOUNT_STATUS.ACTIVE
        ? ACCOUNT_STATUS.SUSPENDED
        : ACCOUNT_STATUS.ACTIVE;

    const action =
      nextStatus === ACCOUNT_STATUS.SUSPENDED ? 'suspend' : 'reactivate';

    if (
      !window.confirm(
        `Are you sure you want to ${action} "${profile.display_name}"?`,
      )
    ) {
      return;
    }

    setSavingId(profile.id);
    setError('');
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ account_status: nextStatus })
      .eq('id', profile.id);
    setSavingId(null);

    if (updateError) {
      alert('Could not update account status: ' + updateError.message);
      return;
    }

    setUsers((prev) =>
      prev.map((row) =>
        row.id === profile.id ? { ...row, account_status: nextStatus } : row,
      ),
    );
    setNotice(`Account ${nextStatus === ACCOUNT_STATUS.SUSPENDED ? 'suspended' : 'reactivated'} for ${profile.display_name}.`);
  };

  const toggleAdmin = async (profile) => {
    const next = !profile.is_admin;
    const label = next ? 'grant admin access to' : 'remove admin access from';

    if (profile.id === currentUserId && !next) {
      setError('You cannot remove your own admin access.');
      return;
    }

    if (!window.confirm(`Are you sure you want to ${label} "${profile.display_name}"?`)) {
      return;
    }

    setSavingId(profile.id);
    setError('');
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ is_admin: next })
      .eq('id', profile.id);
    setSavingId(null);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setUsers((prev) =>
      prev.map((row) => (row.id === profile.id ? { ...row, is_admin: next } : row)),
    );
    setNotice(`${profile.display_name} is ${next ? 'now an admin' : 'no longer an admin'}.`);
  };

  return (
    <section className="admin-page">
      <div className="admin-page__head">
        <h2>User Management</h2>
        <p>Search users by name, email, or status and manage account access.</p>
      </div>

      {error && <div className="login-error">{error}</div>}
      <AdminNotice message={notice} onDismiss={() => setNotice('')} />

      <div className="admin-toolbar">
        <label className="admin-toolbar__search">
          <Search size={18} strokeWidth={2} aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by name, email, or status…"
            aria-label="Search users by name, email, or status"
          />
        </label>
      </div>

      <div className="admin-panel admin-panel--flush">
        {loading ? (
          <p className="admin-table-empty">Loading users…</p>
        ) : filteredUsers.length === 0 ? (
          <p className="admin-table-empty">
            {users.length === 0 ? 'No users found.' : 'No users match your search.'}
          </p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Joined</th>
                  <th>Saved recipes</th>
                  <th>Status</th>
                  <th>Admin</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((profile) => {
                  const isSelf = profile.id === currentUserId;

                  return (
                    <tr key={profile.id}>
                      <td data-label="Name">
                        <span className="admin-user-table__name">
                          {profile.display_name || 'Unnamed user'}
                          {profile.is_admin && (
                            <span className="admin-badge admin-badge--admin">Admin</span>
                          )}
                        </span>
                      </td>
                      <td data-label="Email">{profile.email || '—'}</td>
                      <td data-label="Joined">
                        {profile.created_at
                          ? new Date(profile.created_at).toLocaleDateString()
                          : '—'}
                      </td>
                      <td data-label="Saved recipes">{profile.savedRecipes}</td>
                      <td data-label="Status">
                        <div className="admin-user-table__status">
                          <UserStatusToggle
                            profile={profile}
                            saving={savingId === profile.id}
                            disabled={isSelf}
                            onToggle={() => toggleAccountStatus(profile)}
                          />
                          {isSelf && (
                            <span className="admin-user-table__hint">
                              Cannot suspend yourself
                            </span>
                          )}
                        </div>
                      </td>
                      <td data-label="Admin">
                        <button
                          type="button"
                          className="btn btn--secondary admin-table__btn"
                          disabled={savingId === profile.id || (isSelf && profile.is_admin)}
                          onClick={() => toggleAdmin(profile)}
                        >
                          {savingId === profile.id
                            ? 'Saving…'
                            : profile.is_admin
                              ? 'Revoke admin'
                              : 'Make admin'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
