/** PanKo — Blog post card: like, save, comment thread. */
import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { displayNameFromProfile } from '../utils/profile';
import RecipeTagList from './RecipeTagList';

export default function RecipePostCard({
  post,
  highlighted,
  likeCount,
  userLiked,
  userSaved,
  comments,
  currentUserId,
  onInteraction,
  onLibraryChanged,
}) {
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [busy, setBusy] = useState(false);

  const authorName = displayNameFromProfile(
    post.profiles,
    post.author_email,
  );

  const ingredients = post.ingredients || [];
  const steps = post.steps || [];

  const toggleLike = async () => {
    if (!currentUserId || busy) return;
    setBusy(true);

    if (userLiked) {
      await supabase
        .from('recipe_post_likes')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', currentUserId);
    } else {
      await supabase.from('recipe_post_likes').insert([
        { post_id: post.id, user_id: currentUserId },
      ]);
    }

    setBusy(false);
    onInteraction?.();
  };

  const saveToLibrary = async () => {
    if (!currentUserId || userSaved || busy) return;
    setBusy(true);

    const { error: saveTrackError } = await supabase.from('recipe_post_saves').insert([
      { post_id: post.id, user_id: currentUserId },
    ]);

    if (saveTrackError && saveTrackError.code !== '23505') {
      alert('Could not save: ' + saveTrackError.message);
      setBusy(false);
      return;
    }

    // Avoid creating duplicate library rows if the user saves again.
    const { data: existingRecipe, error: existingError } = await supabase
      .from('recipes')
      .select('id')
      .eq('user_id', currentUserId)
      .eq('source_post_id', post.id)
      .maybeSingle();

    if (existingError && existingError.code !== '42703') {
      // 42703 = undefined column (source_post_id missing). We'll handle via fallback insert below.
      alert('Could not check library: ' + existingError.message);
      setBusy(false);
      return;
    }

    let recipeError = null;
    if (!existingRecipe) {
      // Preferred insert (when schema supports source_post_id + tags)
      const preferred = await supabase.from('recipes').insert([
        {
          user_id: currentUserId,
          source_post_id: post.id,
          title: post.title,
          time: post.time,
          ingredients: post.ingredients,
          steps: post.steps,
          tags: post.tags || [],
        },
      ]);

      recipeError = preferred.error || null;

      // Fallback if the DB doesn't have optional columns yet (older schema).
      if (recipeError && (recipeError.code === '42703' || /source_post_id|tags/i.test(recipeError.message))) {
        const fallback = await supabase.from('recipes').insert([
          {
            user_id: currentUserId,
            title: post.title,
            time: post.time,
            ingredients: post.ingredients,
            steps: post.steps,
          },
        ]);
        recipeError = fallback.error || null;
      }
    }

    setBusy(false);

    if (recipeError) {
      alert('Could not add to your library: ' + recipeError.message);
      return;
    }

    onInteraction?.();
    onLibraryChanged?.();
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!currentUserId || !commentText.trim() || submittingComment) return;

    setSubmittingComment(true);
    const { error } = await supabase.from('recipe_post_comments').insert([
      {
        post_id: post.id,
        user_id: currentUserId,
        content: commentText.trim(),
      },
    ]);
    setSubmittingComment(false);

    if (error) {
      alert('Could not post comment: ' + error.message);
      return;
    }

    setCommentText('');
    onInteraction?.();
  };

  return (
    <article
      id={`blog-post-${post.id}`}
      className={`blog-card ${expanded ? 'blog-card--expanded' : ''} ${highlighted ? 'blog-card--highlighted' : ''}`}
    >
      <header className="blog-card__header">
        <div>
          <p className="blog-card__author">by {authorName}</p>
          <h3 className="blog-card__title">{post.title}</h3>
          <p className="blog-card__meta">⏱ {post.time || '—'}</p>
          <RecipeTagList tags={post.tags} className="blog-card__tags" />
        </div>
        {likeCount > 0 && (
          <span className="blog-card__badge">
            <i className="fa-solid fa-heart" aria-hidden="true" /> {likeCount}
          </span>
        )}
      </header>

      <div className="blog-card__actions">
        <button
          type="button"
          className={`blog-card__action ${userLiked ? 'blog-card__action--active' : ''}`}
          onClick={toggleLike}
          disabled={busy || !currentUserId}
        >
          <i className="fa-solid fa-heart" aria-hidden="true" />{' '}
          {userLiked ? 'Liked' : 'Like'} ({likeCount})
        </button>
        <button
          type="button"
          className={`blog-card__action ${userSaved ? 'blog-card__action--saved' : ''}`}
          onClick={saveToLibrary}
          disabled={busy || userSaved || !currentUserId}
        >
          {userSaved ? (
            <>
              <i className="fa-solid fa-check" aria-hidden="true" /> Saved to library
            </>
          ) : (
            <>
              <i className="fa-solid fa-bookmark" aria-hidden="true" /> Save to my library
            </>
          )}
        </button>
        <button
          type="button"
          className="blog-card__action"
          onClick={() => setExpanded((v) => !v)}
        >
          <i className="fa-solid fa-eye" aria-hidden="true" />{' '}
          {expanded ? 'Hide recipe' : 'View recipe'}
        </button>
        <button
          type="button"
          className="blog-card__action"
          onClick={() => setShowComments((v) => !v)}
        >
          <i className="fa-solid fa-message" aria-hidden="true" /> Comments ({comments.length})
        </button>
      </div>

      {expanded && (
        <div className="blog-card__body">
          <div className="blog-card__column">
            <h4>Ingredients</h4>
            <ul>
              {ingredients.length === 0 ? (
                <li>No ingredients listed</li>
              ) : (
                ingredients.map((ing, idx) => (
                  <li key={idx}>
                    <strong>
                      {ing.amount} {ing.unit}
                    </strong>{' '}
                    {ing.name}
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="blog-card__column">
            <h4>Steps</h4>
            <ol>
              {steps.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {showComments && (
        <div className="blog-card__comments">
          {comments.length === 0 ? (
            <p className="blog-card__comments-empty">No comments yet.</p>
          ) : (
            <ul className="blog-card__comment-list">
              {comments.map((c) => (
                <li key={c.id}>
                  <strong>
                    {displayNameFromProfile(c.profiles, c.author_email)}:
                  </strong>{' '}
                  {c.content}
                </li>
              ))}
            </ul>
          )}
          <form className="blog-card__comment-form" onSubmit={submitComment}>
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment…"
              disabled={!currentUserId}
            />
            <button type="submit" className="btn" disabled={submittingComment}>
              Post
            </button>
          </form>
        </div>
      )}
    </article>
  );
}
