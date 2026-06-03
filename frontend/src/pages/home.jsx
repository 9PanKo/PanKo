/** PanKo — Home shell: sidebar sections, library, blog, Chef's Eye, voice. */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Sidebar from '../components/Sidebar';
import VoiceAssistantFab from '../components/VoiceAssistantFab';
import ChefsEye from './chefseye';
import RecipeBlog from './recipeblog';
import HomeLanding from '../components/home/HomeLanding';
import ProfileSection from '../components/home/ProfileSection';
import EditProfileModal from '../components/home/EditProfileModal';
import RecipeLibrarySection from '../components/home/RecipeLibrarySection';
import { useTheme } from '../hooks/useTheme';
import { useRecipes } from '../hooks/useRecipes';
import { useProfileSection } from '../hooks/useProfileSection';
import { useLibraryVoiceSearch } from '../hooks/useLibraryVoiceSearch';
import { useHomeVoice } from '../hooks/useHomeVoice';
import { importRecipeToBlog } from '../utils/recipeBlog';
import { isEmailConfirmed } from '../utils/auth';
import { signOutIfSuspended } from '../utils/accountAccess';
import { clearLastRoute } from '../utils/lastRoute';
import { getHomeSectionFromSearch, homeSectionSearch } from '../utils/homeSections';
import { isSavedFromBlog } from '../utils/recipeLibrary';

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const activeSection = getHomeSectionFromSearch(location.search);
  const [tagSearch, setTagSearch] = useState('');
  const [selectedBlogPostId, setSelectedBlogPostId] = useState(null);

  const goToSection = useCallback(
    (section) => {
      navigate({ pathname: '/home', search: homeSectionSearch(section) }, { replace: true });
    },
    [navigate],
  );

  const { theme, toggleTheme } = useTheme();
  const { recipes, loading, refreshRecipes, setRecipes } = useRecipes();
  const [deletingRecipeId, setDeletingRecipeId] = useState(null);
  const profileState = useProfileSection(user, activeSection);

  const myRecipesForProfile = useMemo(() => {
    if (!user?.id) return [];
    return recipes
      .filter((r) => r.user_id === user.id && !isSavedFromBlog(r))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [recipes, user?.id]);

  const libraryVoice = useLibraryVoiceSearch({
    setActiveSection: goToSection,
    setTagSearch,
    tagSearch,
    recipes,
    onOpenRecipe: (id) => navigate(`/recipe/${id}`),
  });
  const voice = useHomeVoice({
    setActiveSection: goToSection,
    libraryVoiceCommands: libraryVoice.libraryVoiceCommands,
    onFinalTranscriptRef: libraryVoice.onFinalTranscriptRef,
  });

  useEffect(() => {
    const init = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser) {
        navigate('/');
        return;
      }
      if (!isEmailConfirmed(currentUser)) {
        await supabase.auth.signOut();
        navigate('/', { state: { emailNotConfirmed: true } });
        return;
      }

      const access = await signOutIfSuspended(currentUser);
      if (!access.ok) {
        clearLastRoute();
        if (access.reason === 'suspended') {
          navigate('/', { state: { accountSuspended: true } });
        } else {
          navigate('/');
        }
        return;
      }

      setUser(currentUser);
    };

    refreshRecipes();
    init();
  }, [navigate, refreshRecipes]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clearLastRoute();
    navigate('/');
  };

  const handleChefEyeSaved = async () => {
    await refreshRecipes();
    goToSection('recipes');
  };

  const handleDeleteRecipe = async (recipe) => {
    if (!window.confirm(`Delete "${recipe.title}"? This cannot be undone.`)) return;

    setDeletingRecipeId(recipe.id);
    const { error } = await supabase.from('recipes').delete().eq('id', recipe.id);
    setDeletingRecipeId(null);

    if (error) {
      alert('Could not delete recipe: ' + error.message);
      return;
    }

    setRecipes((prev) => prev.filter((row) => row.id !== recipe.id));
  };

  const handleImportToBlog = async (recipe) => {
    const result = await importRecipeToBlog(recipe, user);
    if (!result.ok) {
      if (result.reason === 'duplicate') {
        alert('This recipe is already on the blog.');
      } else if (result.reason === 'error') {
        alert('Could not import to blog: ' + result.message);
      }
      return;
    }
    alert('Imported to blog!');
    setSelectedBlogPostId(null);
    goToSection('blog');
  };

  return (
    <div
      className={`home-layout ${sidebarCollapsed ? 'home-layout--sidebar-collapsed' : ''}`}
    >
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
        activeSection={activeSection}
        onSectionChange={goToSection}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="home-main">
        {activeSection === 'home' && (
          <HomeLanding
            isSupported={voice.isSupported}
            isListening={voice.isListening}
            voiceLabel={voice.voiceLabel}
            transcript={voice.transcript}
            onToggleListening={voice.toggleListening}
          />
        )}

        {activeSection === 'profile' && (
          <ProfileSection
            user={user}
            profile={profileState.profile}
            myRecipes={myRecipesForProfile}
            likedPosts={profileState.likedPosts}
            loadingLists={profileState.loadingLists}
            onEditProfile={profileState.openEdit}
            onOpenRecipe={(id) => navigate(`/recipe/${id}`)}
            onOpenBlogPost={(postId) => {
              setSelectedBlogPostId(postId);
              goToSection('blog');
            }}
          />
        )}

        <EditProfileModal
          open={profileState.isEditOpen}
          editDisplayName={profileState.editDisplayName}
          setEditDisplayName={profileState.setEditDisplayName}
          oldPassword={profileState.oldPassword}
          setOldPassword={profileState.setOldPassword}
          newPassword={profileState.newPassword}
          setNewPassword={profileState.setNewPassword}
          repeatNewPassword={profileState.repeatNewPassword}
          setRepeatNewPassword={profileState.setRepeatNewPassword}
          saving={profileState.saving}
          editError={profileState.editError}
          onClose={profileState.closeEdit}
          onSubmit={profileState.saveProfile}
        />

        {activeSection === 'chefseye' && (
          <section className="home-section home-section--chefseye">
            <ChefsEye onSaved={handleChefEyeSaved} />
          </section>
        )}

        {activeSection === 'blog' && (
          <section className="home-section">
            <RecipeBlog
              user={user}
              onLibraryChanged={refreshRecipes}
              selectedBlogPostId={selectedBlogPostId}
            />
          </section>
        )}

        {activeSection === 'recipes' && (
          <RecipeLibrarySection
            user={user}
            profile={profileState.profile}
            recipes={recipes}
            loading={loading}
            tagSearch={tagSearch}
            setTagSearch={setTagSearch}
            libraryVoiceSearchActive={libraryVoice.libraryVoiceSearchActive}
            librarySearchInputRef={libraryVoice.librarySearchInputRef}
            onCreateRecipe={() => navigate('/create')}
            onOpenRecipe={(id) => navigate(`/recipe/${id}`)}
            onImportToBlog={handleImportToBlog}
            onDeleteRecipe={handleDeleteRecipe}
            deletingRecipeId={deletingRecipeId}
          />
        )}
      </main>

      {activeSection !== 'home' && (
        <VoiceAssistantFab
          isListening={voice.isListening}
          onToggle={voice.toggleListening}
          isSupported={voice.isSupported}
          isAwaitingCommand={voice.isAwaitingCommand}
          wakeWordMode={voice.wakeWordMode}
        />
      )}
    </div>
  );
}
