import { authHeaders } from './supabaseClient';

/**
 * Origin of the PlourX AI server, which stores uploaded profile pictures for every PlourX app.
 * Defaults to the hosted server (profiles live in the shared Supabase project, so dev and production
 * agree). Set VITE_PLOURX_API_URL, e.g. http://localhost:3000, to use a locally running server instead.
 */
export const PLOURX_API_ORIGIN: string =
  (import.meta.env.VITE_PLOURX_API_URL as string | undefined) || 'https://Plour-X-ai.onrender.com';

export const AVATAR_EVENT = 'plourx:avatar-changed';

export type AvatarErrorCode = 'type' | 'size' | 'upload' | 'save';

export class AvatarError extends Error {
  readonly code: AvatarErrorCode;
  constructor(code: AvatarErrorCode) {
    super(code);
    this.code = code;
  }
}

const MAX_SOURCE_BYTES = 10 * 1024 * 1024;
const OUTPUT_PX = 512;

/** Centre-crops to a square and downsizes, so every avatar is small, square and consistently framed. */
async function toSquareJpeg(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  try {
    const side = Math.min(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = Math.min(OUTPUT_PX, side);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas');
    // JPEG has no alpha; paint a neutral backdrop under transparent PNGs.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
    if (!blob) throw new Error('encode');
    return new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
  } finally {
    bitmap.close();
  }
}

async function patchAvatar(avatarUrl: string | null) {
  const response = await fetch(`${PLOURX_API_ORIGIN}/api/profile`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify({ avatarUrl }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new AvatarError('save');
}

function announce() {
  window.dispatchEvent(new Event(AVATAR_EVENT));
}

/** Uploads a new profile picture and makes it the shared PlourX profile picture. */
export async function changeAvatar(file: File): Promise<void> {
  if (!file.type.startsWith('image/')) throw new AvatarError('type');
  if (file.size > MAX_SOURCE_BYTES) throw new AvatarError('size');

  let prepared: File;
  try {
    prepared = await toSquareJpeg(file);
  } catch {
    throw new AvatarError('type');
  }

  let path: string;
  try {
    const form = new FormData();
    form.append('file', prepared);
    form.append('purpose', 'avatar');
    const response = await fetch(`${PLOURX_API_ORIGIN}/api/uploads`, {
      method: 'POST',
      headers: await authHeaders(),
      body: form,
      signal: AbortSignal.timeout(90_000),
    });
    if (!response.ok) throw new Error(String(response.status));
    path = (await response.json()).file?.url;
    if (typeof path !== 'string') throw new Error('shape');
  } catch (err) {
    console.error('Profile photo upload failed:', err);
    throw new AvatarError('upload');
  }

  await patchAvatar(path);
  announce();
}

export async function removeAvatar(): Promise<void> {
  await patchAvatar(null);
  announce();
}
