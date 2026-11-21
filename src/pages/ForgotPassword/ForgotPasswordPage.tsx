import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AuthCard } from '../../components/auth/AuthCard';
import { Mail } from '../../lib/flatIcons/icons';
import { PillField, PillSubmit } from '../../components/auth/PillAuth';
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
        <p className="pxa-msg pxa-msg-ok" role="status">Check your inbox for a password reset link.</p>
      ) : (
        <form className="pxa-form" onSubmit={onSubmit} noValidate>
          <PillField label="Email" icon={<Mail />} name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email address" error={error ?? undefined} autoComplete="email" />
          <PillSubmit disabled={sending}>{sending ? 'Sending…' : 'Send reset link'}</PillSubmit>
        </form>
      )}
    </AuthCard>
  );
}
