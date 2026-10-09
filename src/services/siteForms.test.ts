import { afterEach, describe, expect, it, vi } from 'vitest'
import { FormSubmitError, postForm, validateContact, validateFeedback } from './siteForms'

const respond = (status: number, body: unknown) => vi.fn().mockResolvedValue({ ok: status >= 200 && status < 300, status, json: async () => body })
const htmlPage = () => vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => Promise.reject(new SyntaxError('Unexpected token <')) })

afterEach(() => vi.unstubAllGlobals())

describe('validateContact', () => {
  it('requires every field and a valid email', () => {
    expect(Object.keys(validateContact({ name: '', email: '', subject: '', message: '' })).sort()).toEqual(['email', 'message', 'name', 'subject'])
    expect(validateContact({ name: 'A', email: 'nope', subject: 'S', message: 'long enough message' }).email).toMatch(/valid email/)
    expect(validateContact({ name: 'A', email: 'a@b.co', subject: 'S', message: 'long enough message' })).toEqual({})
  })

  it('needs at least 10 characters in the message', () => {
    expect(validateContact({ name: 'A', email: 'a@b.co', subject: 'S', message: '123456789' }).message).toBeTruthy()
    expect(validateContact({ name: 'A', email: 'a@b.co', subject: 'S', message: '1234567890' }).message).toBeUndefined()
  })
})

describe('validateFeedback', () => {
  const ok = { name: '', email: '', category: 'bug' as const, rating: 4, message: 'something is broken' }

  it('accepts anonymous feedback', () => {
    expect(validateFeedback(ok)).toEqual({})
  })

  it('requires a category, a 1-5 rating and a message, and checks an email only if given', () => {
    const errors = validateFeedback({ name: '', email: 'bad', category: '', rating: 0, message: 'short' })
    expect(Object.keys(errors).sort()).toEqual(['category', 'email', 'message', 'rating'])
    expect(validateFeedback({ ...ok, rating: 6 }).rating).toBeTruthy()
    expect(validateFeedback({ ...ok, rating: 2.5 }).rating).toBeTruthy()
  })
})

describe('postForm', () => {
  it('sends the app id and an empty honeypot, and succeeds only on { ok: true }', async () => {
    const fetchMock = respond(200, { ok: true })
    vi.stubGlobal('fetch', fetchMock)
    await postForm('/api/contact', { name: 'A' })
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url.endsWith('/api/contact')).toBe(true)
    const body = JSON.parse(String(init.body)) as Record<string, unknown>
    expect(body).toMatchObject({ name: 'A', website: '' })
    expect(typeof body.app).toBe('string')
  })

  it('does not treat a 200 that is not the API answer (an HTML page) as sent', async () => {
    vi.stubGlobal('fetch', htmlPage())
    await expect(postForm('/api/feedback', {})).rejects.toBeInstanceOf(FormSubmitError)
    vi.stubGlobal('fetch', respond(200, { something: 'else' }))
    await expect(postForm('/api/feedback', {})).rejects.toBeInstanceOf(FormSubmitError)
  })

  it('surfaces field errors and the unavailable flag from the server', async () => {
    vi.stubGlobal('fetch', respond(400, { error: 'Please check the highlighted fields.', fields: { email: 'bad' } }))
    await expect(postForm('/api/contact', {})).rejects.toMatchObject({ fields: { email: 'bad' }, unavailable: false })
    vi.stubGlobal('fetch', respond(403, { error: 'This form is currently unavailable.' }))
    await expect(postForm('/api/contact', {})).rejects.toMatchObject({ unavailable: true })
  })

  it('reports a network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    await expect(postForm('/api/contact', {})).rejects.toThrow(/Network error/)
  })
})
