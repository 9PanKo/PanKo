import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { isEmailConfirmed } from '../utils/auth';
import { signOutIfSuspended } from '../utils/accountAccess';
import { clearLastRoute } from '../utils/lastRoute';

/** PanKo — Guard protected routes (auth, email confirm, not suspended). */
export function useRequireActiveAccount({ onUser } = {}) {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) navigate('/');
        return;
      }

      if (!isEmailConfirmed(user)) {
        await supabase.auth.signOut();
        if (!cancelled) navigate('/', { state: { emailNotConfirmed: true } });
        return;
      }

      const access = await signOutIfSuspended(user);
      if (cancelled) return;

      if (!access.ok) {
        clearLastRoute();
        if (access.reason === 'suspended') {
          navigate('/', { state: { accountSuspended: true } });
        } else {
          navigate('/');
        }
        return;
      }

      onUser?.(user, access.profile);
    };

    verify();
    return () => {
      cancelled = true;
    };
  }, [navigate]);
}
