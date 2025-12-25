import type { APIRoute } from 'astro';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { checkAuth } from './auth';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });

const error = (message: string, status = 400) => json({ error: message }, status);

// GET - Fetch all config values
export const GET: APIRoute = async ({ cookies }) => {
  const authError = checkAuth(cookies);
  if (authError) return authError;

  if (!isSupabaseConfigured()) {
    return error('Supabase not configured', 500);
  }

  try {
    const { data, error: dbError } = await supabase!
      .from('app_config')
      .select('key, value, updated_at')
      .order('key');

    if (dbError) {
      console.error('[admin/config] Database error:', dbError);
      return error('Failed to fetch config', 500);
    }

    // Convert array to object for easier use
    const configObject: Record<string, { value: string; updated_at: string }> = {};
    (data || []).forEach((item) => {
      configObject[item.key] = {
        value: item.value,
        updated_at: item.updated_at,
      };
    });

    return json(configObject);
  } catch (err) {
    console.error('[admin/config] Error:', err);
    return error('Failed to fetch config', 500);
  }
};

// PUT - Update config values
export const PUT: APIRoute = async ({ request, cookies }) => {
  const authError = checkAuth(cookies);
  if (authError) return authError;

  if (!isSupabaseConfigured()) {
    return error('Supabase not configured', 500);
  }

  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return error('Key and value are required', 400);
    }

    // Use upsert to update or insert
    const { data, error: dbError } = await supabase!
      .from('app_config')
      .upsert(
        {
          key,
          value: String(value),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'key',
        }
      )
      .select()
      .single();

    if (dbError) {
      console.error('[admin/config] Database error:', dbError);
      return error('Failed to update config', 500);
    }

    return json(data);
  } catch (err) {
    console.error('[admin/config] Error:', err);
    return error('Failed to update config', 500);
  }
};

