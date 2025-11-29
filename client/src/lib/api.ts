const isDevelopment = import.meta.env.DEV;

export const API_BASE_URL = isDevelopment 
  ? '' 
  : 'https://easysplit-sn5f.onrender.com';

export function getApiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}
