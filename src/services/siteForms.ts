import { WEBSITE_API_BASE } from '../config/api'

const APP_SLUG = 'browser'

/**
 * Contact and Feedback forms, sent to the same PlourX website API (and stored in the same place) as the forms on the
 * website. The rules below mirror the server's, which validates again: this only gives instant feedback.
 */

export class FormSubmitError extends Error {
  fields: Record<string, string>
  /** An admin has switched this form off (HTTP 403). */
  unavailable: boolean
  constructor(message: string, fields: Record<string, string> = {}, unavailable = false) {
    super(message)
    this.name = 'FormSubmitError'
    this.fields = fields
    this.unavailable = unavailable
  }
}

export const LIMITS = { name: 100, email: 254, subject: 150, message: 2000, minMessage: 10 } as const

export type FeedbackCategory = 'general' | 'bug' | 'feature' | 'ui' | 'performance' | 'other'

export const FEEDBACK_CATEGORIES: ReadonlyArray<{ value: FeedbackCategory; label: string }> = [
  { value: 'general', label: 'General Feedback' },
  { value: 'bug', label: 'Bug Report' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'ui', label: 'UI / Design' },
  { value: 'performance', label: 'Performance' },
  { value: 'other', label: 'Other' },
]

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface ContactInput {
  name: string
  email: string
  subject: string
  message: string
}

export interface FeedbackInput {
  name: string
  email: string
  category: FeedbackCategory | ''
  rating: number
  message: string
}

export type FieldErrors<T> = Partial<Record<keyof T, string>>

export function validateContact(input: ContactInput): FieldErrors<ContactInput> {
  const errors: FieldErrors<ContactInput> = {}
  if (!input.name.trim()) errors.name = 'Please enter your name.'
  if (!input.email.trim()) errors.email = 'Please enter your email.'
  else if (!EMAIL_PATTERN.test(input.email.trim())) errors.email = 'Please enter a valid email address.'
  if (!input.subject.trim()) errors.subject = 'Please enter a subject.'
  if (input.message.trim().length < LIMITS.minMessage) errors.message = `Please write at least ${LIMITS.minMessage} characters.`
  return errors
}

export function validateFeedback(input: FeedbackInput): FieldErrors<FeedbackInput> {
  const errors: FieldErrors<FeedbackInput> = {}
  if (input.email.trim() && !EMAIL_PATTERN.test(input.email.trim())) errors.email = 'Please enter a valid email address.'
  if (!input.category) errors.category = 'Please choose a category.'
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) errors.rating = 'Please select a rating from 1 to 5.'
  if (input.message.trim().length < LIMITS.minMessage) errors.message = `Please write at least ${LIMITS.minMessage} characters.`
  return errors
}

/** Posts a form. It only counts as sent when the API itself answers `{ ok: true }`, never on a bare 2xx. */
export async function postForm(path: '/api/contact' | '/api/feedback', payload: object): Promise<void> {
  let res: Response
  try {
    res = await fetch(`${WEBSITE_API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, app: APP_SLUG, website: '' }),
      signal: AbortSignal.timeout(20_000),
    })
  } catch {
    throw new FormSubmitError('Network error. Please check your connection and try again.')
  }
  const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string; fields?: Record<string, string> } | null
  if (res.ok && data?.ok === true) return
  throw new FormSubmitError(data?.error || 'Something went wrong. Please try again.', data?.fields, res.status === 403)
}

export const submitContact = (input: ContactInput) => postForm('/api/contact', input)
export const submitFeedback = (input: FeedbackInput) => postForm('/api/feedback', input)

const SUPABASE_URL = ((import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '').replace(/\/$/, '')
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? ''

/** Whether an admin has each form switched on. Fails open: if it can't be read, the form stays usable (the server decides). */
export async function getFormAvailability(): Promise<{ contact: boolean; feedback: boolean }> {
  const open = { contact: true, feedback: true }
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return open
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_form_availability`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
      body: '{}',
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return open
    const body = (await res.json()) as unknown
    const row = (Array.isArray(body) ? body[0] : body) as { contact_enabled?: boolean; feedback_enabled?: boolean } | null
    if (!row) return open
    return { contact: Boolean(row.contact_enabled), feedback: Boolean(row.feedback_enabled) }
  } catch {
    return open
  }
}
