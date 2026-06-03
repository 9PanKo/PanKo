/** PanKo — Admin top bar with logout. */
export default function DashboardHeader({ onLogout }) {
  return (
    <header className="dashboard-header">
      <div className="dashboard-header__left">
        <div>
          <h1 className="dashboard-header__title">Admin Dashboard</h1>
          <p className="dashboard-header__subtitle">Manage recipes, blog, and users</p>
        </div>
      </div>

      <div className="dashboard-header__right">
        <button
          type="button"
          className="btn btn--secondary dashboard-header__logout"
          onClick={onLogout}
        >
          <i className="fa-solid fa-right-from-bracket" aria-hidden="true" />
          <span>Log out</span>
        </button>
      </div>
    </header>
  );
}
