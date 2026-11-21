import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthCard } from '../../components/auth/AuthCard';
import { Lock, Mail, User } from '../../lib/flatIcons/icons';
import { PillField, PillSocial, PillSubmit } from '../../components/auth/PillAuth';
import { CountrySelect } from '../../components/auth/CountrySelect';
import { GenderSelect } from '../../components/auth/GenderSelect';
import type { Gender } from '../../lib/gender';
import { useAuth } from '../../services/auth/AuthContext';
import { EmailVerificationPending } from './EmailVerificationPending';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  countryCode?: string;
  gender?: string;
}

export function SignupPage() {
  const { signUp, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [gender, setGender] = useState<Gender | null>(null);
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
    if (!gender) next.gender = 'Please select your gender.';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setSubmitting(true);
    const result = await signUp(email.trim(), password, name.trim(), countryCode!, gender!);
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
      title="Get Started with PlourX"
      subtitle="Create your PlourX account and access the entire ecosystem with one seamless login."
      footer={
        <>
          Already have an account? <Link to="/login">Log in</Link>
        </>
      }
    >
      <form className="pxa-form" onSubmit={onSubmit} noValidate>
        <PillField label="Full name" icon={<User />} name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" error={fieldErrors.name} autoComplete="name" />
        <PillField label="Email" icon={<Mail />} name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email address" error={fieldErrors.email} autoComplete="email" />
        <PillField label="Password" icon={<Lock />} name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" error={fieldErrors.password} autoComplete="new-password" />
        <PillField label="Confirm password" icon={<Lock />} name="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter your password" error={fieldErrors.confirmPassword} autoComplete="new-password" />
        <CountrySelect value={countryCode} onChange={setCountryCode} error={fieldErrors.countryCode} required />
        <GenderSelect value={gender} onChange={setGender} error={fieldErrors.gender} required />
        {error && <p className="pxa-msg pxa-msg-err" role="alert">{error}</p>}
        <PillSubmit disabled={submitting}>{submitting ? 'Creating account…' : 'Create account'}</PillSubmit>
        <PillSocial />
      </form>
    </AuthCard>
  );
}
