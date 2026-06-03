import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { saveLastRoute } from '../utils/lastRoute';

/** PanKo — Persist current URL for refresh / re-login. */
export default function RoutePersistence() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    saveLastRoute(pathname, search);
  }, [pathname, search]);

  return null;
}
