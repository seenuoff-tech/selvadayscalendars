/**
 * Central API configuration helper supporting single-domain or separate frontend/backend deployments.
 * Set VITE_API_URL in environment (e.g. https://api.selvadayscalendar.sspicture.com) when separating frontend & backend.
 */
export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return API_BASE ? `${API_BASE}${cleanPath}` : cleanPath;
}
