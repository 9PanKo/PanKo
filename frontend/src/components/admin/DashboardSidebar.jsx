/** PanKo — Admin sidebar navigation tabs. */
import { NavLink } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { ADMIN_TABS } from './adminNav';

export default function DashboardSidebar({ activeTab, collapsed, onToggle }) {
  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`} aria-label="Admin sidebar">
      <button
        type="button"
        className="sidebar__toggle"
        onClick={onToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand' : 'Collapse'}
      >
        <ChevronRight
          size={18}
          strokeWidth={2.5}
          className={collapsed ? '' : 'sidebar__toggle-icon--open'}
          aria-hidden="true"
        />
      </button>

      <nav className="sidebar__nav" aria-label="Admin navigation">
        {ADMIN_TABS.map((item) => {
          const isActive = activeTab === item.id;

          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={`sidebar__link${isActive ? ' sidebar__link--active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              title={item.label}
            >
              <span className="sidebar__icon" aria-hidden="true">
                <i className={item.iconClass} />
              </span>
              {!collapsed && (
                <span className="sidebar__label">
                  <span className="sidebar__label-text">{item.label}</span>
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
