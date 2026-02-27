// In production on Vercel, set VITE_API_URL to your backend API base (e.g. https://your-api.railway.app/api)
export const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '/api';
