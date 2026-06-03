/** PanKo — Admin dashboard sidebar routes. */
export const ADMIN_TABS = [
  {
    id: 'overview',
    label: 'Dashboard Overview',
    path: '/admin/dashboard',
    iconClass: 'fa-solid fa-chart-simple',
  },
  {
    id: 'recipes',
    label: 'Recipe Management',
    path: '/admin/recipes',
    iconClass: 'fa-solid fa-bars-progress',
  },
  {
    id: 'blog',
    label: 'Blog Management',
    path: '/admin/blog',
    iconClass: 'fa-solid fa-users-gear',
  },
  {
    id: 'users',
    label: 'User Management',
    path: '/admin/users',
    iconClass: 'fa-solid fa-user-gear',
  },
];

export function resolveActiveTab(pathname) {
  const match = ADMIN_TABS.find(
    (tab) => pathname === tab.path || pathname.startsWith(`${tab.path}/`),
  );
  return match?.id ?? 'overview';
}
