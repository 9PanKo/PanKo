/** PanKo — User profile row sync with Supabase auth. */
import { supabase } from '../supabaseClient';

async function syncProfileEmail(userId, email) {
  if (!userId || !email) return;
  await supabase.from('profiles').update({ email }).eq('id', userId);
}

export async function ensureProfile(user) {
  if (!user?.id) return null;

  const displayName =
    user.user_metadata?.display_name ||
    user.email?.split('@')[0] ||
    'Chef';

  const { data: existing, error: existingError } = await supabase
    .from('profiles')
    .select('id, display_name, account_status, email')
    .eq('id', user.id)
    .maybeSingle();

  if (!existingError && existing?.display_name) {
    if (user.email && !existing.email) {
      await syncProfileEmail(user.id, user.email);
      return { ...existing, email: user.email };
    }
    return existing;
  }

  const row = {
    id: user.id,
    display_name: existing?.display_name || displayName,
    account_status: existing?.account_status || 'active',
  };

  if (user.email) row.email = user.email;

  const { data, error } = await supabase
    .from('profiles')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    if (user.email) {
      const fallbackRow = { ...row };
      delete fallbackRow.email;
      const { data: retryData, error: retryError } = await supabase
        .from('profiles')
        .upsert(fallbackRow, { onConflict: 'id' })
        .select()
        .single();
      if (!retryError) return retryData;
    }

    console.error('Profile upsert failed:', error);
    return { id: user.id, display_name: displayName };
  }

  return data;
}

export function displayNameFromProfile(profile, fallbackEmail) {
  if (profile?.display_name) return profile.display_name;
  if (fallbackEmail) return fallbackEmail.split('@')[0];
  return 'Chef';
}
