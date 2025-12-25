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

// GET - Fetch all backgrounds
export const GET: APIRoute = async ({ cookies }) => {
  const authError = checkAuth(cookies);
  if (authError) return authError;

  if (!isSupabaseConfigured()) {
    return error('Supabase not configured', 500);
  }

  try {
    const { data, error: dbError } = await supabase!
      .from('backgrounds')
      .select('id, url, display_url, name, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (dbError) {
      console.error('[admin/backgrounds] Database error:', dbError);
      return error('Failed to fetch backgrounds', 500);
    }

    return json(data || []);
  } catch (err) {
    console.error('[admin/backgrounds] Error:', err);
    return error('Failed to fetch backgrounds', 500);
  }
};

// POST - Upload image to imgbb and save to database
export const POST: APIRoute = async ({ request, cookies }) => {
  const authError = checkAuth(cookies);
  if (authError) return authError;

  if (!isSupabaseConfigured()) {
    return error('Supabase not configured', 500);
  }

  const imgbbApiKey = import.meta.env.IMGBB_API_KEY;
  if (!imgbbApiKey) {
    return error('IMGBB_API_KEY not configured', 500);
  }

  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const name = formData.get('name') as string | null;

    if (!file) {
      return error('No image file provided', 400);
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');

    // Upload to imgbb - send base64 as form data
    const imgbbFormData = new FormData();
    imgbbFormData.append('image', base64Image);
    if (name) {
      imgbbFormData.append('name', name);
    }

    const imgbbResponse = await fetch(
      `https://api.imgbb.com/1/upload?key=${imgbbApiKey}`,
      {
        method: 'POST',
        body: imgbbFormData,
      }
    );

    if (!imgbbResponse.ok) {
      const errorData = await imgbbResponse.json().catch(() => ({}));
      console.error('[admin/backgrounds] imgbb error:', errorData);
      return error('Failed to upload image to imgbb', 500);
    }

    const imgbbData = await imgbbResponse.json();

    if (!imgbbData.success || !imgbbData.data) {
      console.error('[admin/backgrounds] imgbb response error:', imgbbData);
      return error('imgbb upload failed', 500);
    }

    // Save to database
    const { data, error: dbError } = await supabase!
      .from('backgrounds')
      .insert({
        url: imgbbData.data.url,
        display_url: imgbbData.data.display_url || imgbbData.data.url,
        name: name || imgbbData.data.title || null,
      })
      .select()
      .single();

    if (dbError) {
      console.error('[admin/backgrounds] Database error:', dbError);
      return error('Failed to save background to database', 500);
    }

    return json(data, 201);
  } catch (err) {
    console.error('[admin/backgrounds] Error:', err);
    return error('Failed to upload background', 500);
  }
};

// DELETE - Remove background by ID
export const DELETE: APIRoute = async ({ url, cookies }) => {
  const authError = checkAuth(cookies);
  if (authError) return authError;

  if (!isSupabaseConfigured()) {
    return error('Supabase not configured', 500);
  }

  try {
    const id = url.searchParams.get('id');
    if (!id) {
      return error('Background ID is required', 400);
    }

    const { error: dbError } = await supabase!
      .from('backgrounds')
      .delete()
      .eq('id', id);

    if (dbError) {
      console.error('[admin/backgrounds] Database error:', dbError);
      return error('Failed to delete background', 500);
    }

    return json({ success: true });
  } catch (err) {
    console.error('[admin/backgrounds] Error:', err);
    return error('Failed to delete background', 500);
  }
};

