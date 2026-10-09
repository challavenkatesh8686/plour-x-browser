import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Star } from 'lucide-react';
import { AuthButton } from '../auth/AuthButton';
import { useAuth } from '../../services/auth/AuthContext';
import {
  FEEDBACK_CATEGORIES,
  FormSubmitError,
  LIMITS,
  getFormAvailability,
  submitFeedback,
  validateFeedback,
  type FeedbackInput,
  type FieldErrors,
} from '../../services/siteForms';
import { FormSheet } from './FormSheet';
import styles from './SiteForms.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
}

/** "Send feedback": the same form, endpoint and storage as the feedback page on the PlourX website. Name and email are optional. */
export function FeedbackFormSheet({ open, onClose }: Props) {
  return (
    <FormSheet open={open} onClose={onClose} title="Send feedback" description="Found a bug or have an idea? We read everything.">
      {/* Mounted only while open, so every opening starts fresh and pre-filled. */}
      {open && <FeedbackForm />}
    </FormSheet>
  );
}

function FeedbackForm() {
  const { profile, user } = useAuth();
  const uid = useId();
  const [form, setForm] = useState<FeedbackInput>(() => ({ name: profile?.name ?? '', email: user?.email ?? profile?.email ?? '', category: '', rating: 0, message: '' }));
  const [errors, setErrors] = useState<FieldErrors<FeedbackInput>>({});
  const [available, setAvailable] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    let active = true;
    void getFormAvailability().then((a) => {
      if (active) setAvailable(a.feedback);
    });
    return () => {
      active = false;
    };
  }, []);

  const set = <K extends keyof FeedbackInput>(name: K, value: FeedbackInput[K]) => {
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (inFlight.current) return;
    const next = validateFeedback(form);
    setErrors(next);
    if (Object.keys(next).length) return;
    inFlight.current = true;
    setSubmitting(true);
    setError(null);
    try {
      await submitFeedback(form);
      setSent(true);
      setForm((f) => ({ name: f.name, email: f.email, category: '', rating: 0, message: '' }));
    } catch (e) {
      if (e instanceof FormSubmitError) {
        if (e.unavailable) setAvailable(false);
        setErrors(e.fields as FieldErrors<FeedbackInput>);
        setError(e.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  if (available === false) return <p className={styles.unavailable}>Feedback is currently unavailable. Please check back later.</p>;

  if (sent) {
    return (
      <div className={styles.done} role="status">
        <strong>Thank you!</strong>
        <p>Your feedback helps us improve PlourX.</p>
        <AuthButton variant="outline" fullWidth onClick={() => setSent(false)}>
          Send more feedback
        </AuthButton>
      </div>
    );
  }

  const err = (key: keyof FeedbackInput) =>
    errors[key] && (
      <span id={`${uid}-${key}-error`} className={styles.error}>
        {errors[key]}
      </span>
    );
  const describedBy = (key: keyof FeedbackInput) => (errors[key] ? `${uid}-${key}-error` : undefined);

  return (
    <form className={styles.form} onSubmit={submit} noValidate aria-busy={submitting}>
      <div className={styles.field}>
        <label htmlFor={`${uid}-name`} className={styles.label}>
          Name (optional)
        </label>
        <input id={`${uid}-name`} className={styles.input} value={form.name} maxLength={LIMITS.name} autoComplete="name" disabled={submitting} onChange={(e) => set('name', e.target.value)} />
      </div>
      <div className={styles.field}>
        <label htmlFor={`${uid}-email`} className={styles.label}>
          Email (optional)
        </label>
        <input
          id={`${uid}-email`}
          className={styles.input}
          type="email"
          value={form.email}
          maxLength={LIMITS.email}
          autoComplete="email"
          disabled={submitting}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={describedBy('email')}
          onChange={(e) => set('email', e.target.value)}
        />
        {err('email')}
      </div>
      <div className={styles.field}>
        <label htmlFor={`${uid}-category`} className={styles.label}>
          Feedback category
        </label>
        <select
          id={`${uid}-category`}
          className={styles.input}
          value={form.category}
          disabled={submitting}
          aria-invalid={Boolean(errors.category)}
          aria-describedby={describedBy('category')}
          onChange={(e) => set('category', e.target.value as FeedbackInput['category'])}
        >
          <option value="" disabled>
            Select a category…
          </option>
          {FEEDBACK_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        {err('category')}
      </div>
      <div className={styles.field}>
        <span id={`${uid}-rating-label`} className={styles.label}>
          Rating
        </span>
        <div className={styles.stars} role="radiogroup" aria-labelledby={`${uid}-rating-label`} aria-describedby={describedBy('rating')}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={form.rating === n}
              aria-label={`${n} out of 5`}
              disabled={submitting}
              className={`${styles.star} ${n <= form.rating ? styles.starOn : ''}`}
              onClick={() => set('rating', n)}
            >
              <Star aria-hidden="true" />
            </button>
          ))}
        </div>
        {err('rating')}
      </div>
      <div className={styles.field}>
        <label htmlFor={`${uid}-message`} className={styles.label}>
          Your feedback
        </label>
        <textarea
          id={`${uid}-message`}
          className={styles.input}
          rows={5}
          value={form.message}
          maxLength={LIMITS.message}
          disabled={submitting}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={describedBy('message')}
          onChange={(e) => set('message', e.target.value)}
        />
        {err('message')}
      </div>
      {error && (
        <p className={styles.formError} role="alert">
          {error}
        </p>
      )}
      <AuthButton type="submit" variant="primary" fullWidth disabled={submitting || available === null}>
        {submitting ? 'Sending…' : 'Send feedback'}
      </AuthButton>
    </form>
  );
}
