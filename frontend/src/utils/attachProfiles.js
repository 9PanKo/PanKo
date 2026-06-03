/** PanKo — Join profile display names onto blog rows. */
import { supabase } from '../supabaseClient';

/**
 * Attach profile display names to rows (posts, comments, etc.).
 * @param {string} profileKey - property name on each row (e.g. 'profiles' or 'author_profile')
 * @param {string} userIdKey - column holding user id (e.g. 'author_id' or 'user_id')
 */
export async function attachProfiles(
  rows,
  { profileKey = 'profiles', userIdKey = 'author_id' } = {},
) {
  if (!rows?.length) return [];

  const userIds = [
    ...new Set(rows.map((r) => r[userIdKey] || r.user_id).filter(Boolean)),
  ];
  if (userIds.length === 0) return rows;

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', userIds);

  if (error) {
    console.error('Error fetching profiles:', error);
    return rows;
  }

  const byId = Object.fromEntries((profiles || []).map((p) => [p.id, p]));

  return rows.map((row) => ({
    ...row,
    [profileKey]: byId[row[userIdKey] || row.user_id] || null,
  }));
}
