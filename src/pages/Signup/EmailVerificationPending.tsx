import { useState } from 'react';
import { Mail } from 'lucide-react';
import { AuthCard } from '../../components/auth/AuthCard';
import styles from '../../components/auth/AuthCard.module.css';
import { AuthButton } from '../../components/auth/AuthButton';
import { useAuth } from '../../services/auth/AuthContext';

export function EmailVerificationPending({ email }: { email: string }) {
  const { resendVerificationEmail } = useAuth();
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  async function onResend() {
    setResending(true);
    setResendMessage(null);
    setResendError(null);
    const result = await resendVerificationEmail(email);
    setResending(false);
    if (result.error) {
      setResendError(result.error);
      return;
    }
    setResendMessage('Verification email resent.');
  }

  return (
    <AuthCard title="Check your inbox" subtitle="We've sent a verification link to your email. Please verify to continue.">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
        <Mail size={22} color="var(--px-accent)" />
        <p style={{ fontWeight: 700 }}>{email}</p>
        {resendMessage && <p className={styles.success}>{resendMessage}</p>}
        {resendError && <p className={styles.error}>{resendError}</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
          <AuthButton type="button" variant="outline" fullWidth disabled={resending} onClick={onResend}>
            {resending ? 'Resending…' : 'Resend verification email'}
          </AuthButton>
          <AuthButton to="/login" variant="primary" fullWidth>
            Back to login
          </AuthButton>
        </div>
      </div>
    </AuthCard>
  );
}
