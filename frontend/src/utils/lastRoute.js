/** PanKo — Session return URL after login (excludes auth/editor paths). */
const STORAGE_KEY = 'panko_last_path';

/** Paths that should not overwrite the stored return URL (auth + editor flows). */
const SKIP_PATHS = new Set(['/', '/signup', '/create']);

export function isAdminRoute(path = '') {
  const pathname = path.split('?')[0];
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

export function saveLastRoute(pathname, search = '') {
  if (SKIP_PATHS.has(pathname)) return;
  sessionStorage.setItem(STORAGE_KEY, `${pathname}${search}`);
}

export function getLastRoute(fallback = '/home') {
  return sessionStorage.getItem(STORAGE_KEY) || fallback;
}

/** Drop a saved admin URL so non-admins are not sent back to /admin on login. */
export function clearAdminLastRoute() {
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (stored && isAdminRoute(stored)) {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Where to send the user right after login (or when login already has a session).
 * Admins → admin area; everyone else → app routes only (never a stored /admin path).
 */
export function resolvePostLoginRoute(isAdmin) {
  const stored = sessionStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return isAdmin ? '/admin/dashboard' : '/home';
  }

  if (isAdminRoute(stored)) {
    return isAdmin ? stored : '/home';
  }

  return isAdmin ? '/admin/dashboard' : stored;
}

export function clearLastRoute() {
  sessionStorage.removeItem(STORAGE_KEY);
}
