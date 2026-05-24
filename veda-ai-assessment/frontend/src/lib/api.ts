export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * A centralized wrapper around the native `fetch` API.
 * Automatically prepends the correct backend URL to all requests.
 * 
 * @param endpoint The API endpoint (e.g., '/api/assignments')
 * @param options Standard fetch options
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  // Ensure the endpoint starts with a slash
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_URL}${formattedEndpoint}`;
  
  return fetch(url, options);
}
