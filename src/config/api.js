// API Configuration
// In development, uses localhost. In production, uses the VITE_API_URL environment variable.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const API_BASE = `${API_URL}/api/shortcuts`;
export const AUTH_API_BASE = `${API_URL}/api/auth`;
export const PROXY_IMAGE_URL = `${API_URL}/api/proxy-image`;

export default API_URL;
