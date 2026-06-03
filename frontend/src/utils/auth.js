/** PanKo — Auth helpers (email confirmation, error messages). */
export function isEmailConfirmed(user) {
  if (!user) return false;
  return Boolean(user.email_confirmed_at);
}

export const EMAIL_NOT_CONFIRMED_MSG =
  'Please confirm your email before logging in. Check your inbox for the confirmation link.';

export function isEmailNotConfirmedError(error) {
  if (!error?.message) return false;
  const msg = error.message.toLowerCase();
  return msg.includes('email not confirmed') || msg.includes('not confirmed');
}

export { ACCOUNT_SUSPENDED_MSG } from './accountAccess';
