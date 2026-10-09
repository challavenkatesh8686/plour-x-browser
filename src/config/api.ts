/**
 * Origin of the deployed PlourX website API that serves /api/contact and /api/feedback (the About page forms).
 * The app is bundled with the device and has no same-origin server, so it calls it by address. Override with
 * VITE_API_BASE to use another deployment (for example a staging site).
 */
export const WEBSITE_API_BASE = ((import.meta.env.VITE_API_BASE as string | undefined) || 'https://plour-x-website.vercel.app').replace(/\/$/, '')
