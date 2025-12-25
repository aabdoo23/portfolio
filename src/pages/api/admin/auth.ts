import type { APIRoute } from 'astro';

/**
 * Helper function to check if a request is authenticated
 * Returns the response if not authenticated, null if authenticated
 */
export function checkAuth(cookies: any): Response | null {
  const token = cookies.get('admin_token')?.value;

  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // In a production app, you'd validate the token against a session store
  // For simplicity, we just check if the cookie exists
  return null;
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });

export const GET: APIRoute = async ({ cookies }) => {
  const authError = checkAuth(cookies);
  if (authError) return authError;

  return json({ authenticated: true });
};

