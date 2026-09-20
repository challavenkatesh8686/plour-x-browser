import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthCard } from '../../components/auth/AuthCard';
import styles from '../../components/auth/AuthCard.module.css';
import { FormField } from '../../components/auth/FormField';
import { CountrySelect } from '../../components/auth/CountrySelect';
import { AuthButton } from '../../components/auth/AuthButton';
import { useAuth } from '../../services/auth/AuthContext';
import { EmailVerificationPending } from './EmailVerificationPending';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  countryCode?: string;
}

export function SignupPage() {
  const { signUp, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated && !confirmationSent) {
      navigate('/', { replace: true });
    }
  }, [loading, isAuthenticated, confirmationSent, navigate]);

  function validate(): boolean {
    const next: FieldErrors = {};
    if (!name.trim()) next.name = 'Please enter your name.';
    if (!email.trim()) next.email = 'Please enter your email.';
    else if (!EMAIL_PATTERN.test(email)) next.email = 'Enter a valid email address.';
    if (password.length < 6) next.password = 'Password must be at least 6 characters.';
    if (confirmPassword !== password) next.confirmPassword = 'Passwords do not match.';
    if (!countryCode) next.countryCode = 'Please select your country.';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setSubmitting(true);
    const result = await signUp(email.trim(), password, name.trim(), countryCode!);
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.session) {
      navigate('/', { replace: true });
      return;
    }

    // Email confirmation is required -- there's no session yet.
    setConfirmationSent(true);
  }

  if (confirmationSent) {
    return <EmailVerificationPending email={email.trim()} />;
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Join PlourX — one account for the whole ecosystem"
      footer={
        <>
          Already have an account? <Link to="/login">Log in</Link>
        </>
      }
    >
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <FormField label="Full name" name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required error={fieldErrors.name} autoComplete="name" />
        <FormField label="Email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required error={fieldErrors.email} autoComplete="email" />
        <FormField
          label="Password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
          required
          error={fieldErrors.password}
          autoComplete="new-password"
        />
        <FormField
          label="Confirm password"
          name="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter your password"
          required
          error={fieldErrors.confirmPassword}
          autoComplete="new-password"
        />
        <CountrySelect value={countryCode} onChange={setCountryCode} error={fieldErrors.countryCode} required />
        {error && <p className={styles.error}>{error}</p>}
        <AuthButton type="submit" variant="primary" fullWidth disabled={submitting}>
          {submitting ? 'Creating account…' : 'Sign up'}
        </AuthButton>
      </form>
    </AuthCard>
  );
}
