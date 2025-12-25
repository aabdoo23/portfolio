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
  if (!isSupabaseConfigured()) {
    console.error('[api/content/notes] Supabase not configured');
    return error('Database not configured', 503);
  }

  try {
    console.log('[api/content/notes] Attempting to fetch notes from Supabase...');
    const { data, error: dbError } = await supabase!
      .from('notes')
      .select('id, title, content, updated_at')
      .order('updated_at', { ascending: false });

    if (dbError) {
      console.error('[api/content/notes] Database error:', dbError);
      console.error('[api/content/notes] Error details:', JSON.stringify(dbError, null, 2));
      return error('Failed to fetch notes from database', 500);
    }

    console.log('[api/content/notes] Successfully fetched notes:', data?.length || 0, 'notes');

    // Transform database rows to match Note interface (updated_at -> updatedAt)
    const transformedNotes = (data || []).map((note) => ({
      id: note.id,
      title: note.title,
      content: note.content,
      updatedAt: note.updated_at,
    }));

    return json(transformedNotes);
  } catch (err) {
    console.error('[api/content/notes] Unexpected error:', err);
    console.error('[api/content/notes] Error stack:', err instanceof Error ? err.stack : 'No stack trace');
    return error('Internal server error', 500);
  }
};

