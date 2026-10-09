import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { AuthButton } from '../auth/AuthButton';
import { useAuth } from '../../services/auth/AuthContext';
import { FormSubmitError, LIMITS, getFormAvailability, submitContact, validateContact, type ContactInput, type FieldErrors } from '../../services/siteForms';
import { FormSheet } from './FormSheet';
import styles from './SiteForms.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
}

/** "Contact us": the same form, endpoint and storage as the contact page on the PlourX website. */
export function ContactFormSheet({ open, onClose }: Props) {
  return (
    <FormSheet open={open} onClose={onClose} title="Contact us" description="Questions or need help? Send us a message and we'll get back to you by email.">
      {/* Mounted only while open, so every opening starts fresh and pre-filled. */}
      {open && <ContactForm />}
    </FormSheet>
  );
}

function ContactForm() {
  const { profile, user } = useAuth();
  const uid = useId();
  const [form, setForm] = useState<ContactInput>(() => ({ name: profile?.name ?? '', email: user?.email ?? profile?.email ?? '', subject: '', message: '' }));
  const [errors, setErrors] = useState<FieldErrors<ContactInput>>({});
  const [available, setAvailable] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  // Whether an admin has this form switched on.
  useEffect(() => {
    let active = true;
    void getFormAvailability().then((a) => {
      if (active) setAvailable(a.contact);
    });
    return () => {
      active = false;
    };
  }, []);

  const set = (name: keyof ContactInput, value: string) => {
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (inFlight.current) return;
    const next = validateContact(form);
    setErrors(next);
    if (Object.keys(next).length) return;
    inFlight.current = true;
    setSubmitting(true);
    setError(null);
    try {
      await submitContact(form);
      setSent(true);
      setForm((f) => ({ ...f, subject: '', message: '' }));
    } catch (e) {
      if (e instanceof FormSubmitError) {
        if (e.unavailable) setAvailable(false);
        setErrors(e.fields as FieldErrors<ContactInput>);
        setError(e.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  const field = (name: keyof ContactInput, label: string, extra: { type?: string; max: number; multiline?: boolean; autoComplete?: string }) => {
    const id = `${uid}-${name}`;
    const common = {
      id,
      className: styles.input,
      value: form[name],
      maxLength: extra.max,
      disabled: submitting,
      'aria-invalid': Boolean(errors[name]),
      'aria-describedby': errors[name] ? `${id}-error` : undefined,
    };
    return (
      <div className={styles.field}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        {extra.multiline ? (
          <textarea rows={5} {...common} onChange={(e) => set(name, e.target.value)} />
        ) : (
          <input type={extra.type ?? 'text'} autoComplete={extra.autoComplete} {...common} onChange={(e) => set(name, e.target.value)} />
        )}
        {errors[name] && (
          <span id={`${id}-error`} className={styles.error}>
            {errors[name]}
          </span>
        )}
      </div>
    );
  };

  if (available === false) return <p className={styles.unavailable}>Contact messages are currently unavailable. Please check back later.</p>;

  if (sent) {
    return (
      <div className={styles.done} role="status">
        <strong>Message sent</strong>
        <p>Thank you for contacting PlourX. We'll reply to {form.email.trim() || 'your email'} soon.</p>
        <AuthButton variant="outline" fullWidth onClick={() => setSent(false)}>
          Send another message
        </AuthButton>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate aria-busy={submitting}>
      {field('name', 'Name', { max: LIMITS.name, autoComplete: 'name' })}
      {field('email', 'Email', { type: 'email', max: LIMITS.email, autoComplete: 'email' })}
      {field('subject', 'Subject', { max: LIMITS.subject })}
      {field('message', 'Message', { max: LIMITS.message, multiline: true })}
      {error && (
        <p className={styles.formError} role="alert">
          {error}
        </p>
      )}
      <AuthButton type="submit" variant="primary" fullWidth disabled={submitting || available === null}>
        {submitting ? 'Sending…' : 'Send message'}
      </AuthButton>
    </form>
  );
}
