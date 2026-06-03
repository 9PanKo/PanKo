/** PanKo — Admin shell: auth gate, sidebar, nested routes. */
import { useEffect, useMemo, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { isEmailConfirmed } from '../../utils/auth';
import { checkIsAdmin, fetchAdminProfile } from '../../utils/admin';
import { clearAdminLastRoute } from '../../utils/lastRoute';
import { requireActiveAccount } from '../../utils/accountAccess';
import { resolveActiveTab } from './adminNav';
import DashboardSidebar from './DashboardSidebar';
import DashboardHeader from './DashboardHeader';
import '../../styles/admin.css';

export default function DashboardLayout() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [redirectState, setRedirectState] = useState(null);
  const [profile, setProfile] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  const activeTab = useMemo(() => resolveActiveTab(location.pathname), [location.pathname]);

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !isEmailConfirmed(user)) {
        if (!cancelled) {
          setAuthorized(false);
          setRedirectState(null);
          setLoading(false);
        }
        return;
      }

      const access = await requireActiveAccount(user);
      if (!access.ok) {
        if (!cancelled) {
          await supabase.auth.signOut();
          setAuthorized(false);
          setRedirectState(
            access.reason === 'suspended' ? { accountSuspended: true } : null,
          );
          setLoading(false);
        }
        return;
      }

      const isAdmin = await checkIsAdmin(user);
      if (!isAdmin) {
        if (!cancelled) {
          clearAdminLastRoute();
          setAuthorized(false);
          setRedirectState({ adminAccessDenied: true });
          setLoading(false);
        }
        return;
      }

      const adminProfile = await fetchAdminProfile(user);
      if (!cancelled) {
        setProfile(adminProfile);
        setUserEmail(user.email || '');
        setAuthorized(true);
        setLoading(false);
      }
    };

    verify();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <p>Loading admin dashboard…</p>
      </div>
    );
  }

  if (!authorized) {
    return <Navigate to="/" replace state={redirectState} />;
  }

  return (
    <div
      className={`dashboard-layout${sidebarCollapsed ? ' dashboard-layout--sidebar-collapsed' : ''}`}
    >
      <DashboardSidebar
        activeTab={activeTab}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((value) => !value)}
      />
      <div className="dashboard-shell">
        <DashboardHeader onLogout={handleLogout} />
        <main className="dashboard-content">
          <Outlet context={{ profile, userEmail, activeTab }} />
        </main>
      </div>
    </div>
  );
}
