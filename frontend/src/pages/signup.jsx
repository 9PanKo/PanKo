/** PanKo — Sign-up page (terms gate, email confirmation flow). */
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ensureProfile } from '../utils/profile';
import { isEmailConfirmed } from '../utils/auth';
import { getLastRoute } from '../utils/lastRoute';
import PasswordInput from '../components/PasswordInput';

export default function SignUp() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [termsScrolledToBottom, setTermsScrolledToBottom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const termsBodyRef = useRef(null);

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
    if (!isTermsOpen) return;
    setTermsScrolledToBottom(false);
    const el = termsBodyRef.current;
    if (!el) return;
    el.scrollTop = 0;
  }, [isTermsOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Client-side validation
    if (!name.trim()) return setErrorMsg('Please enter your name.');
    if (!email.trim()) return setErrorMsg('Please enter your email.');
    if (!password) return setErrorMsg('Please create a password.');
    if (password.length < 8) return setErrorMsg('Password must be at least 8 characters.');
    if (password !== confirmPassword) return setErrorMsg('Passwords do not match.');
    if (!agree) return setErrorMsg('You must agree to the terms and conditions.');

    setLoading(true);

    // Supabase sign-up; may require email confirmation
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { display_name: name.trim() },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    const user = data?.user;
    const session = data?.session;

    if (session && user && isEmailConfirmed(user)) {
      await ensureProfile(user);
      navigate(getLastRoute('/home'));
      setLoading(false);
      return;
    }

    if (session && user && !isEmailConfirmed(user)) {
      await supabase.auth.signOut();
    }

    navigate('/', {
      state: {
        emailConfirmationSent: true,
        email: email.trim(),
      },
    });
    setLoading(false);
  };

  return (
    <div className="container" style={{ maxWidth: '420px', marginTop: '8vh' }}>
      <button
        type="button"
        className="btn btn--secondary"
        onClick={() => navigate('/')}
        style={{ marginBottom: '20px' }}
      >
        <i className="fa-solid fa-arrow-left" aria-hidden="true" /> Back to login
      </button>

      <h1>Create your account</h1>
      <p style={{ color: 'var(--text-muted)' }}>Join and start saving recipes.</p>

      {errorMsg && <div className="login-error">{errorMsg}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="signup-name">Name</label>
          <input
            id="signup-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="signup-email">Email</label>
          <input
            id="signup-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <PasswordInput
          id="signup-password"
          label="Create a password"
          required
          value={password}
          onChange={setPassword}
          placeholder="Enter at least 8 characters"
        />

        <PasswordInput
          id="signup-confirm"
          label="Confirm password"
          required
          value={confirmPassword}
          onChange={setConfirmPassword}
        />

        <label className="terms-check">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
          />
          <span>
            I agree to the{' '}
            <button
              type="button"
              className="terms-link"
              onClick={() => setIsTermsOpen(true)}
            >
              Terms and Conditions
            </button>
          </span>
        </label>

        <button type="submit" className="btn" style={{ width: '100%', marginTop: '16px' }} disabled={loading}>
          {loading ? 'Creating account…' : 'Sign up'}
        </button>
      </form>

      {isTermsOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Terms and Conditions">
          <div className="modal">
            <div className="modal__header">
              <h2 className="modal__title">Terms & Conditions</h2>
              <button
                type="button"
                className="modal__close"
                onClick={() => setIsTermsOpen(false)}
                aria-label="Close"
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>

            <div
              className="modal__body"
              ref={termsBodyRef}
              onScroll={() => {
                const el = termsBodyRef.current;
                if (!el) return;
                const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 4;
                if (atBottom) setTermsScrolledToBottom(true);
              }}
            >
              <p>
                Welcome to <strong>PanKo</strong>. By creating an account or using the website,
                you agree to these Terms & Conditions.
              </p>

              <h3>1) What you can share</h3>
              <ul>
                <li>Recipes you create, including title, ingredients, steps, time, and tags.</li>
                <li>Comments you post on community recipes.</li>
                <li>Photos you upload to Chef&apos;s Eye to generate a recipe suggestion.</li>
              </ul>

              <h3>2) Content rules</h3>
              <ul>
                <li>Do not upload or post illegal, harmful, or abusive content.</li>
                <li>Do not share personal data (phone numbers, addresses, IDs) in recipes or comments.</li>
                <li>You are responsible for what you post; keep it accurate and safe.</li>
              </ul>

              <h3>3) Safety & cooking disclaimer</h3>
              <p>
                Recipes are for informational purposes. Always follow food safety guidelines, check allergies,
                and use good judgment when cooking.
              </p>

              <h3>4) How we use your information</h3>
              <ul>
                <li><strong>Account data</strong> (email, name): used to authenticate you and show your profile name.</li>
                <li><strong>Recipes</strong>: stored to power your personal library and (if you publish) the community blog.</li>
                <li><strong>Chef&apos;s Eye images</strong>: used to generate a recipe suggestion. We do not intend to identify you from photos.</li>
                <li><strong>Voice transcripts</strong>: used locally to execute commands (e.g., “next”, “profile”).</li>
              </ul>

              <h3>5) Limits & fair use</h3>
              <ul>
                <li>Do not spam posts, likes, or comments.</li>
                <li>Do not attempt to scrape, reverse engineer, or overload the service.</li>
              </ul>

              <h3>6) Community interactions</h3>
              <p>
                You can like, comment on, and save community recipes. Saving adds a copy to your own library under your account.
              </p>

              <h3>7) Changes</h3>
              <p>
                We may update these terms to improve the website. Continued use means you accept the latest version.
              </p>

            </div>

            <div className="modal__footer">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setIsTermsOpen(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn"
                disabled={!termsScrolledToBottom}
                onClick={() => {
                  setAgree(true);
                  setIsTermsOpen(false);
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

