/** PanKo — Login page (session restore, email confirm, admin routing). */
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import PasswordInput from '../components/PasswordInput';
import {
  isEmailConfirmed,
  EMAIL_NOT_CONFIRMED_MSG,
  isEmailNotConfirmedError,
  ACCOUNT_SUSPENDED_MSG,
} from '../utils/auth';
import { resolvePostLoginRoute } from '../utils/lastRoute';
import { checkIsAdmin } from '../utils/admin';
import { requireActiveAccount } from '../utils/accountAccess';
import { ensureProfile } from '../utils/profile';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, []);

  useEffect(() => {
    const state = location.state;
    if (state?.emailConfirmationSent) {
      setSuccessMsg(
        `We sent a confirmation link to ${state.email || 'your email'}. Please confirm your account, then log in.`,
      );
      navigate(location.pathname, { replace: true, state: null });
    } else if (state?.emailNotConfirmed) {
      setErrorMsg(EMAIL_NOT_CONFIRMED_MSG);
      navigate(location.pathname, { replace: true, state: null });
    } else if (state?.adminAccessDenied) {
      setErrorMsg('You do not have admin access.');
      navigate(location.pathname, { replace: true, state: null });
    } else if (state?.accountSuspended) {
      setErrorMsg(ACCOUNT_SUSPENDED_MSG);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user && isEmailConfirmed(session.user)) {
        const access = await requireActiveAccount(session.user);
        if (!access.ok) return;
        const isAdmin = await checkIsAdmin(session.user);
        navigate(resolvePostLoginRoute(isAdmin));
      }
    };
    checkSession();
  }, [navigate]);

  const handleLogin = async (e) => {
    e?.preventDefault?.();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setErrorMsg(
        isEmailNotConfirmedError(error) ? EMAIL_NOT_CONFIRMED_MSG : error.message,
      );
      setLoading(false);
      return;
    }

    if (!isEmailConfirmed(data.user)) {
      await supabase.auth.signOut();
      setErrorMsg(EMAIL_NOT_CONFIRMED_MSG);
      setLoading(false);
      return;
    }

    const access = await requireActiveAccount(data.user);
    if (!access.ok) {
      await supabase.auth.signOut();
      setErrorMsg(
        access.reason === 'suspended' ? ACCOUNT_SUSPENDED_MSG : 'Unable to sign in.',
      );
      setLoading(false);
      return;
    }

    await ensureProfile(data.user);
    const isAdmin = await checkIsAdmin(data.user);
    navigate(resolvePostLoginRoute(isAdmin));
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="container auth-card">
        <h1>Login</h1>
        <p>Log in or sign up to manage your recipes.</p>

        {successMsg && <div className="login-success">{successMsg}</div>}
        {errorMsg && <div className="login-error">{errorMsg}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <PasswordInput
            id="login-password"
            label="Password"
            required
            value={password}
            onChange={setPassword}
          />

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              type="submit"
              className="btn"
              style={{ flex: 1 }}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Log In'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="btn btn--secondary"
              style={{ flex: 1 }}
              disabled={loading}
            >
              Sign Up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}