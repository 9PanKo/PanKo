/** PanKo — Profile tab: display name, password, liked blog posts. */
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { ensureProfile } from '../utils/profile';
import { attachProfiles } from '../utils/attachProfiles';

export function useProfileSection(user, activeSection) {
  const [profile, setProfile] = useState(null);
  const [likedPosts, setLikedPosts] = useState([]);
  const [loadingLists, setLoadingLists] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [repeatNewPassword, setRepeatNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    if (!user) return;
    ensureProfile(user).then(setProfile);
  }, [user]);

  useEffect(() => {
    const load = async () => {
      if (activeSection !== 'profile' || !user) return;
      setLoadingLists(true);

      const { data: liked, error: likedError } = await supabase
        .from('recipe_post_likes')
        .select('post_id')
        .eq('user_id', user.id);

      if (likedError) {
        console.error('Error fetching liked posts:', likedError);
      }

      const likedIds = (liked || []).map((l) => l.post_id).filter(Boolean);

      let likedPostsData = [];
      if (likedIds.length) {
        const { data: posts, error: postsError } = await supabase
          .from('recipe_posts')
          .select('*')
          .in('id', likedIds)
          .order('created_at', { ascending: false });

        if (postsError) {
          console.error('Error fetching liked post details:', postsError);
        } else {
          likedPostsData = posts || [];
        }
      }

      const likedWithAuthors = await attachProfiles(likedPostsData, {
        profileKey: 'author_profile',
        userIdKey: 'author_id',
      });

      setLikedPosts(likedWithAuthors);
      setLoadingLists(false);
    };

    load();
  }, [activeSection, user]);

  const openEdit = () => {
    setEditError('');
    setEditDisplayName(profile?.display_name || user?.email?.split('@')?.[0] || '');
    setOldPassword('');
    setNewPassword('');
    setRepeatNewPassword('');
    setIsEditOpen(true);
  };

  const closeEdit = () => {
    if (saving) return;
    setIsEditOpen(false);
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!user) return;

    setEditError('');

    const name = editDisplayName.trim();
    if (!name) {
      setEditError('Please enter a username.');
      return;
    }

    const wantsPasswordChange = oldPassword || newPassword || repeatNewPassword;
    if (wantsPasswordChange) {
      if (!oldPassword) {
        setEditError('Please enter your old password.');
        return;
      }
      if (!newPassword) {
        setEditError('Please enter a new password.');
        return;
      }
      if (newPassword.length < 8) {
        setEditError('Password must be at least 8 characters.');
        return;
      }
      if (newPassword !== repeatNewPassword) {
        setEditError('New passwords do not match.');
        return;
      }
    }

    setSaving(true);

    const { data: ensured, error: nameError } = await supabase
      .from('profiles')
      .update({ display_name: name })
      .eq('id', user.id)
      .select('id, display_name')
      .single();

    if (nameError) {
      setSaving(false);
      setEditError(nameError.message || 'Could not update username.');
      return;
    }

    const { error: metaError } = await supabase.auth.updateUser({
      data: { display_name: name },
    });
    if (metaError) {
      console.warn('Could not update auth metadata display_name:', metaError);
    }

    if (wantsPasswordChange) {
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: oldPassword,
      });

      if (reauthError) {
        setSaving(false);
        setEditError('Old password is incorrect.');
        return;
      }

      const { error: pwError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (pwError) {
        setSaving(false);
        setEditError(pwError.message || 'Could not update password.');
        return;
      }
    }

    if (ensured) setProfile((prev) => ({ ...(prev || {}), ...ensured }));
    setSaving(false);
    setIsEditOpen(false);
  };

  return {
    profile,
    likedPosts,
    loadingLists,
    isEditOpen,
    editDisplayName,
    setEditDisplayName,
    oldPassword,
    setOldPassword,
    newPassword,
    setNewPassword,
    repeatNewPassword,
    setRepeatNewPassword,
    saving,
    editError,
    openEdit,
    closeEdit,
    saveProfile,
  };
}
