/** PanKo — Home shell navigation + theme + logout. */
export default function Sidebar({
  collapsed,
  onToggle,
  activeSection,
  onSectionChange,
  onLogout,
  theme,
  onToggleTheme,
}) {
  const handleLogoutClick = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      onLogout();
    }
  };

  const navItems = [
    { id: 'home', label: 'Home', iconClass: 'fa-solid fa-house' },
    { id: 'profile', label: 'Profile', iconClass: 'fa-solid fa-circle-user' },
    { id: 'recipes', label: 'Library', iconClass: 'fa-solid fa-book-open' },
    { id: 'blog', label: 'Recipe Blog', iconClass: 'fa-solid fa-users' },
    { id: 'chefseye', label: "Chef's Eye", iconClass: 'fa-solid fa-kitchen-set', badge: 'AI' },
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      <button
        type="button"
        className="sidebar__toggle"
        onClick={onToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand' : 'Collapse'}
      >
        <i
          className={`fa-solid fa-angle-right ${collapsed ? '' : 'sidebar__toggle-icon--open'}`}
          aria-hidden="true"
        />
      </button>

      <nav className="sidebar__nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`sidebar__link ${activeSection === item.id ? 'sidebar__link--active' : ''}`}
            onClick={() => onSectionChange(item.id)}
            title={item.label}
          >
            <span className="sidebar__icon" aria-hidden="true">
              <i className={item.iconClass} />
            </span>
            {!collapsed && (
              <span className="sidebar__label">
                <span className="sidebar__label-text">{item.label}</span>
                {item.badge && <span className="sidebar__badge">{item.badge}</span>}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar__footer">
        <button
          type="button"
          className="sidebar__link sidebar__link--theme"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span className="sidebar__icon" aria-hidden="true">
            <i className={theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon'} />
          </span>
          {!collapsed && (
            <span className="sidebar__label">
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </span>
          )}
        </button>
        <button
          type="button"
          className="sidebar__link sidebar__link--logout"
          onClick={handleLogoutClick}
          title="Log out"
        >
          <span className="sidebar__icon" aria-hidden="true">
            <i className="fa-solid fa-door-open" />
          </span>
          {!collapsed && <span className="sidebar__label">Log out</span>}
        </button>
      </div>
    </aside>
  );
}
