/** PanKo — Account status gates (active vs suspended). */
import { supabase } from '../supabaseClient';

export const ACCOUNT_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
};

export const ACCOUNT_SUSPENDED_MSG =
  'Your account has been suspended. Please contact support if you believe this is a mistake.';

export function normalizeAccountStatus(status) {
  return status === ACCOUNT_STATUS.SUSPENDED
    ? ACCOUNT_STATUS.SUSPENDED
    : ACCOUNT_STATUS.ACTIVE;
}

export function isAccountSuspended(profile) {
  return normalizeAccountStatus(profile?.account_status) === ACCOUNT_STATUS.SUSPENDED;
}

export function accountStatusLabel(status) {
  return normalizeAccountStatus(status) === ACCOUNT_STATUS.SUSPENDED ? 'Suspended' : 'Active';
}

export async function fetchUserAccessProfile(userId) {
  if (!userId) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, account_status, is_admin')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Profile access check failed:', error);
    return null;
  }

  return data;
}

export async function requireActiveAccount(user) {
  if (!user?.id) {
    return { ok: false, reason: 'unauthenticated' };
  }

  const profile = await fetchUserAccessProfile(user.id);
  if (isAccountSuspended(profile)) {
    return { ok: false, reason: 'suspended', profile };
  }

  return { ok: true, profile };
}

export async function signOutIfSuspended(user) {
  const access = await requireActiveAccount(user);
  if (access.ok) return access;

  if (access.reason === 'suspended') {
    await supabase.auth.signOut();
  }

  return access;
}
