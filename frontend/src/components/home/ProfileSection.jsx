/** PanKo — Profile tab: user info, recipes, liked posts. */
import { displayNameFromProfile } from '../../utils/profile';

export default function ProfileSection({
  user,
  profile,
  myRecipes,
  likedPosts,
  loadingLists,
  onEditProfile,
  onOpenRecipe,
  onOpenBlogPost,
}) {
  if (!user) {
    return (
      <section className="home-section">
        <h1>Profile</h1>
        <p>Loading profile...</p>
      </section>
    );
  }

  const displayName = displayNameFromProfile(profile, user.email);

  return (
    <section className="home-section">
      <h1>Profile</h1>
      <div className="profile-card">
        <div className="profile-card__name-row">
          <p className="profile-card__name">
            <strong>Name</strong>
            <br />
            {displayName}
          </p>
          <button type="button" className="btn" onClick={onEditProfile}>
            Edit profile
          </button>
        </div>
        <p>
          <strong>Email</strong>
          <br />
          {user.email}
        </p>
        <p>
          <strong>Member since</strong>
          <br />
          {new Date(user.created_at).toLocaleDateString()}
        </p>

        <div className="profile-lists">
          <div className="profile-list">
            <h2 className="profile-list__title">Your recipes</h2>
            {loadingLists ? (
              <p className="profile-list__muted">Loading...</p>
            ) : myRecipes.length === 0 ? (
              <p className="profile-list__muted">You haven’t created any recipes yet.</p>
            ) : (
              <ul className="profile-list__items">
                {myRecipes.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      className="profile-list__item profile-list__item--clickable"
                      onClick={() => onOpenRecipe(r.id)}
                    >
                      <span className="profile-list__name">{r.title}</span>
                      <span className="profile-list__meta">⏱ {r.time || '—'}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="profile-list">
            <h2 className="profile-list__title">Liked posts</h2>
            {loadingLists ? (
              <p className="profile-list__muted">Loading...</p>
            ) : likedPosts.length === 0 ? (
              <p className="profile-list__muted">No liked posts yet.</p>
            ) : (
              <ul className="profile-list__items">
                {likedPosts.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className="profile-list__item profile-list__item--clickable"
                      onClick={() => onOpenBlogPost(p.id)}
                    >
                      <span className="profile-list__name">{p.title}</span>
                      <span className="profile-list__meta">
                        by {p.author_profile?.display_name || 'Chef'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
