/** PanKo — Admin role checks via profiles.is_admin. */
import { supabase } from '../supabaseClient';
import { ensureProfile } from './profile';

export async function fetchAdminProfile(user) {
  if (!user?.id) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, is_admin, account_status, created_at')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Admin profile fetch failed:', error);
    return null;
  }

  if (data) return data;

  const created = await ensureProfile(user);
  return created ? { ...created, is_admin: false } : null;
}

export async function checkIsAdmin(user) {
  const profile = await fetchAdminProfile(user);
  return Boolean(profile?.is_admin);
}
