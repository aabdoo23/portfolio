import type { APIRoute } from 'astro';
import crypto from 'crypto';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });

const error = (message: string, status = 401) => json({ error: message }, status);

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { username, password } = body;

    const adminUsername = import.meta.env.ADMIN_USERNAME;
    const adminPassword = import.meta.env.ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword) {
      console.error('[admin/login] Admin credentials not configured');
      return error('Admin access not configured', 500);
    }

    if (username === adminUsername && password === adminPassword) {
      // Generate a session token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour session

      // Store token in cookie
      cookies.set('admin_token', token, {
        httpOnly: true,
        secure: import.meta.env.PROD,
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      });

      return json({
        success: true,
        token,
        expiresAt: expiresAt.toISOString(),
      });
    }

    return error('Invalid credentials', 401);
  } catch (err) {
    console.error('[admin/login] Error:', err);
    return error('Login failed', 500);
  }
};

export const GET: APIRoute = async ({ cookies }) => {
  const token = cookies.get('admin_token')?.value;
  
  if (!token) {
    return json({ authenticated: false }, 401);
  }

  // Simple token validation - in production you might want to store tokens in a session store
  // For now, if cookie exists, consider it valid
  return json({ authenticated: true });
};

