import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthCard } from '../../components/auth/AuthCard';
import styles from '../../components/auth/AuthCard.module.css';
import { FormField } from '../../components/auth/FormField';
import { AuthButton } from '../../components/auth/AuthButton';
import { useAuth } from '../../services/auth/AuthContext';
import { supabase } from '../../services/auth/supabaseClient';

/**
 * Landing page for the Supabase password-recovery email link. Supabase
 * establishes a temporary "recovery" session when the link is opened; we
 * just wait for it via onAuthStateChange before calling updateUser({ password }).
 */
export function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) setReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY' || session) setReady(true);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    const result = await updatePassword(password);
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSuccess(true);
    setTimeout(() => navigate('/', { replace: true }), 1500);
  }

  return (
    <AuthCard title="Choose a new password" subtitle="This link is single-use and expires shortly.">
      {success ? (
        <p className={styles.success}>Password updated. Redirecting…</p>
      ) : !ready ? (
        <p style={{ color: 'var(--px-text-dim)', fontSize: 14 }}>Verifying your reset link…</p>
      ) : (
        <form className={styles.form} onSubmit={onSubmit} noValidate>
          <FormField label="New password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" required autoComplete="new-password" />
          <FormField label="Confirm new password" name="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter your new password" required autoComplete="new-password" />
          {error && <p className={styles.error}>{error}</p>}
          <AuthButton type="submit" variant="primary" fullWidth disabled={submitting}>
            {submitting ? 'Updating…' : 'Update password'}
          </AuthButton>
        </form>
      )}
    </AuthCard>
  );
}
