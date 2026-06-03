/** PanKo — Admin recipe list and CRUD. */
import { useEffect, useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { parseTags } from '../../utils/tags';
import AdminRecipeModal from '../../components/admin/AdminRecipeModal';
import AdminNotice from '../../components/admin/AdminNotice';

function collectCategories(recipes) {
  const tags = new Set();
  recipes.forEach((recipe) => {
    parseTags(recipe?.tags || []).forEach((tag) => tags.add(tag));
  });
  return [...tags].sort();
}

export default function AdminRecipes() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadRecipes = async () => {
    setLoading(true);
    setError('');

    const { data: recipeRows, error: fetchError } = await supabase
      .from('recipes')
      .select('id, title, time, user_id, source_post_id, created_at, tags, ingredients, steps')
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    const recipeData = recipeRows || [];
    const ownerIds = [...new Set(recipeData.map((recipe) => recipe.user_id).filter(Boolean))];
    const ownerNames = new Map();

    if (ownerIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', ownerIds);

      if (profilesError) {
        setError(profilesError.message);
        setLoading(false);
        return;
      }

      (profiles || []).forEach((profile) => {
        ownerNames.set(profile.id, profile.display_name);
      });
    }

    setRecipes(
      recipeData.map((recipe) => ({
        ...recipe,
        ownerName: recipe.user_id
          ? ownerNames.get(recipe.user_id) || 'Unknown user'
          : 'General',
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    loadRecipes();
  }, []);

  const categories = useMemo(() => collectCategories(recipes), [recipes]);

  const filteredRecipes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return recipes.filter((recipe) => {
      const title = String(recipe.title || '').toLowerCase();
      const matchesSearch = !query || title.includes(query);

      const recipeTags = parseTags(recipe?.tags || []);
      const matchesCategory =
        categoryFilter === 'all' || recipeTags.includes(categoryFilter);

      return matchesSearch && matchesCategory;
    });
  }, [recipes, searchQuery, categoryFilter]);

  const openAddModal = () => {
    setModalMode('add');
    setEditingRecipe(null);
    setModalOpen(true);
  };

  const openEditModal = (recipe) => {
    setModalMode('edit');
    setEditingRecipe(recipe);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingRecipe(null);
  };

  const handleDelete = async (recipe) => {
    if (!window.confirm(`Delete recipe "${recipe.title}"? This cannot be undone.`)) return;

    setDeletingId(recipe.id);
    const { error: deleteError } = await supabase.from('recipes').delete().eq('id', recipe.id);
    setDeletingId(null);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setRecipes((prev) => prev.filter((row) => row.id !== recipe.id));
    setNotice(`Deleted "${recipe.title}".`);
  };

  const handleModalSave = async (mode, payload) => {
    setSaving(true);
    setError('');

    const row = {
      title: payload.title,
      time: payload.time,
      ingredients: payload.ingredients,
      steps: payload.steps,
      tags: payload.tags,
    };

    let saveError = null;

    if (mode === 'edit') {
      const { error } = await supabase.from('recipes').update(row).eq('id', payload.id);
      saveError = error;
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) row.user_id = user.id;

      const { error } = await supabase.from('recipes').insert([row]);
      saveError = error;
    }

    setSaving(false);

    if (saveError) {
      setError(saveError.message);
      return;
    }

    closeModal();
    setNotice(mode === 'edit' ? 'Recipe updated successfully.' : 'Recipe created successfully.');
    await loadRecipes();
  };

  return (
    <section className="admin-page">
      <div className="admin-page__head admin-page__head--toolbar">
        <div>
          <h2>Recipe Management</h2>
          <p>Search, filter, and manage recipes across the platform.</p>
        </div>
        <button type="button" className="btn admin-page__primary-action" onClick={openAddModal}>
          <Plus size={18} strokeWidth={2} aria-hidden="true" />
          Add New Recipe
        </button>
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
            placeholder="Search by recipe title…"
            aria-label="Search recipes by title"
          />
        </label>

        <label className="admin-toolbar__select">
          <span>Category</span>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            aria-label="Filter by category"
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="admin-panel admin-panel--flush">
        {loading ? (
          <p className="admin-table-empty">Loading recipes…</p>
        ) : filteredRecipes.length === 0 ? (
          <p className="admin-table-empty">
            {recipes.length === 0 ? 'No recipes found.' : 'No recipes match your filters.'}
          </p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Time</th>
                  <th>Category</th>
                  <th>Owner</th>
                  <th>Created</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {filteredRecipes.map((recipe) => {
                  const tags = parseTags(recipe?.tags || []);
                  return (
                    <tr key={recipe.id}>
                      <td data-label="Title">{recipe.title}</td>
                      <td data-label="Time">{recipe.time || '—'}</td>
                      <td data-label="Category">
                        {tags.length ? tags.join(', ') : '—'}
                      </td>
                      <td data-label="Owner">{recipe.ownerName}</td>
                      <td data-label="Created">
                        {recipe.created_at
                          ? new Date(recipe.created_at).toLocaleDateString()
                          : '—'}
                      </td>
                      <td data-label="Actions">
                        <div className="admin-table__actions">
                          <button
                            type="button"
                            className="btn btn--secondary admin-table__btn"
                            onClick={() => openEditModal(recipe)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn--secondary admin-table__btn admin-table__btn--danger"
                            disabled={deletingId === recipe.id}
                            onClick={() => handleDelete(recipe)}
                          >
                            {deletingId === recipe.id ? 'Deleting…' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdminRecipeModal
        open={modalOpen}
        mode={modalMode}
        recipe={editingRecipe}
        saving={saving}
        onClose={closeModal}
        onSave={handleModalSave}
      />
    </section>
  );
}
