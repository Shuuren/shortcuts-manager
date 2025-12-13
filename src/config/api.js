// API Configuration
// In development, uses localhost. In production (same origin), uses empty string.

// When frontend and backend are served from the same origin, we don't need an absolute URL
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');

export const API_BASE = `${API_URL}/api/shortcuts`;
export const AUTH_API_BASE = `${API_URL}/api/auth`;
export const PROXY_IMAGE_URL = `${API_URL}/api/proxy-image`;

export default API_URL;
