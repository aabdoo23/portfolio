import type { APIRoute } from 'astro';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });

const error = (message: string, status = 500) => json({ error: message }, status);

export const GET: APIRoute = async () => {
  // If Supabase is not configured, return empty array
  if (!isSupabaseConfigured()) {
    console.warn('[api/content/backgrounds] Supabase not configured, returning empty array');
    return json([]);
  }

  try {
    const { data, error: dbError } = await supabase!
      .from('backgrounds')
      .select('id, url, display_url, name')
      .order('created_at', { ascending: false });

    if (dbError) {
      console.error('[api/content/backgrounds] Database error:', dbError);
      return json([]);
    }

    return json(data || []);
  } catch (err) {
    console.error('[api/content/backgrounds] Unexpected error:', err);
    return json([]);
  }
};

