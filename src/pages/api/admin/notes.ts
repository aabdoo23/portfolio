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

// GET - Fetch all notes
export const GET: APIRoute = async ({ cookies }) => {
  const authError = checkAuth(cookies);
  if (authError) return authError;

  if (!isSupabaseConfigured()) {
    return error('Supabase not configured', 500);
  }

  try {
    const { data, error: dbError } = await supabase!
      .from('notes')
      .select('id, title, content, updated_at, created_at')
      .order('updated_at', { ascending: false });

    if (dbError) {
      console.error('[admin/notes] Database error:', dbError);
      return error('Failed to fetch notes', 500);
    }

    return json(data || []);
  } catch (err) {
    console.error('[admin/notes] Error:', err);
    return error('Failed to fetch notes', 500);
  }
};

// POST - Create a new note
export const POST: APIRoute = async ({ request, cookies }) => {
  const authError = await checkAuth(cookies);
  if (authError) return authError;

  if (!isSupabaseConfigured()) {
    return error('Supabase not configured', 500);
  }

  try {
    const body = await request.json();
    const { title, content } = body;

    if (!title || !content) {
      return error('Title and content are required', 400);
    }

    // Generate ID if not provided
    const id = body.id || globalThis.crypto.randomUUID();

    const { data, error: dbError } = await supabase!
      .from('notes')
      .insert({
        id,
        title,
        content,
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error('[admin/notes] Database error:', dbError);
      return error('Failed to create note', 500);
    }

    return json(data, 201);
  } catch (err) {
    console.error('[admin/notes] Error:', err);
    return error('Failed to create note', 500);
  }
};

// PUT - Update an existing note
export const PUT: APIRoute = async ({ request, cookies }) => {
  const authError = await checkAuth(cookies);
  if (authError) return authError;

  if (!isSupabaseConfigured()) {
    return error('Supabase not configured', 500);
  }

  try {
    const body = await request.json();
    const { id, title, content } = body;

    if (!id) {
      return error('Note ID is required', 400);
    }

    if (!title || !content) {
      return error('Title and content are required', 400);
    }

    const { data, error: dbError } = await supabase!
      .from('notes')
      .update({
        title,
        content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (dbError) {
      console.error('[admin/notes] Database error:', dbError);
      return error('Failed to update note', 500);
    }

    if (!data) {
      return error('Note not found', 404);
    }

    return json(data);
  } catch (err) {
    console.error('[admin/notes] Error:', err);
    return error('Failed to update note', 500);
  }
};

// DELETE - Delete a note
export const DELETE: APIRoute = async ({ request, cookies }) => {
  const authError = await checkAuth(cookies);
  if (authError) return authError;

  if (!isSupabaseConfigured()) {
    return error('Supabase not configured', 500);
  }

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return error('Note ID is required', 400);
    }

    const { error: dbError } = await supabase!
      .from('notes')
      .delete()
      .eq('id', id);

    if (dbError) {
      console.error('[admin/notes] Database error:', dbError);
      return error('Failed to delete note', 500);
    }

    return json({ success: true });
  } catch (err) {
    console.error('[admin/notes] Error:', err);
    return error('Failed to delete note', 500);
  }
};

