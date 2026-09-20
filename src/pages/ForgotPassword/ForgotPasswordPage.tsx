import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AuthCard } from '../../components/auth/AuthCard';
import styles from '../../components/auth/AuthCard.module.css';
import { FormField } from '../../components/auth/FormField';
import { AuthButton } from '../../components/auth/AuthButton';
import { useAuth } from '../../services/auth/AuthContext';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!EMAIL_PATTERN.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setSending(true);
    const result = await requestPasswordReset(email.trim());
    setSending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSent(true);
  }

  return (
    <AuthCard
      title="Reset your password"
      subtitle="Enter your email and we'll send you a link to reset your password."
      footer={
        <>
          Remembered it? <Link to="/login">Back to sign in</Link>
        </>
      }
    >
      {sent ? (
        <p className={styles.success}>Check your inbox for a password reset link.</p>
      ) : (
        <form className={styles.form} onSubmit={onSubmit} noValidate>
          <FormField label="Email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required error={error ?? undefined} autoComplete="email" />
          <AuthButton type="submit" variant="primary" fullWidth disabled={sending}>
            {sending ? 'Sending…' : 'Send reset link'}
          </AuthButton>
        </form>
      )}
    </AuthCard>
  );
}
