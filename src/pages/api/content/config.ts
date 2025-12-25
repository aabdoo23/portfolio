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
    console.error('[api/content/config] Supabase not configured');
    return error('Database not configured', 503);
  }

  try {
    console.log('[api/content/config] Attempting to fetch config from Supabase...');
    const { data, error: dbError } = await supabase!
      .from('app_config')
      .select('key, value');

    if (dbError) {
      console.error('[api/content/config] Database error:', dbError);
      console.error('[api/content/config] Error details:', JSON.stringify(dbError, null, 2));
      return error('Failed to fetch config from database', 500);
    }

    console.log('[api/content/config] Successfully fetched config:', data?.length || 0, 'entries');

    // Convert array of {key, value} to object
    const configMap = new Map((data || []).map((item) => [item.key, item.value]));

    // Get config values from database
    const dbPlaylistUrl = configMap.get('apple_music_playlist_url');
    const dbPlaylistName = configMap.get('apple_music_playlist_name');
    const dbAlbumUrl = configMap.get('icloud_photos_album_url');
    const dbSeoTitle = configMap.get('seo_title');
    const dbSeoDescription = configMap.get('seo_description');
    const dbSeoKeywords = configMap.get('seo_keywords');
    
    // Return database values - must be valid strings
    const appleMusicPlaylistUrl = (dbPlaylistUrl && typeof dbPlaylistUrl === 'string' && dbPlaylistUrl.trim()) 
      ? dbPlaylistUrl.trim() 
      : null;
    const appleMusicPlaylistName = (dbPlaylistName && typeof dbPlaylistName === 'string' && dbPlaylistName.trim())
      ? dbPlaylistName.trim()
      : null;
    const iCloudPhotosAlbumUrl = (dbAlbumUrl && typeof dbAlbumUrl === 'string' && dbAlbumUrl.trim())
      ? dbAlbumUrl.trim()
      : null;
    
    // SEO config - parse keywords as JSON array
    const seoTitle = (dbSeoTitle && typeof dbSeoTitle === 'string' && dbSeoTitle.trim()) 
      ? dbSeoTitle.trim() 
      : null;
    const seoDescription = (dbSeoDescription && typeof dbSeoDescription === 'string' && dbSeoDescription.trim())
      ? dbSeoDescription.trim()
      : null;
    let seoKeywords: string[] = [];
    if (dbSeoKeywords && typeof dbSeoKeywords === 'string' && dbSeoKeywords.trim()) {
      try {
        const parsed = JSON.parse(dbSeoKeywords.trim());
        if (Array.isArray(parsed)) {
          seoKeywords = parsed.filter(k => typeof k === 'string');
        }
      } catch (e) {
        // If JSON parsing fails, treat as comma-separated string
        seoKeywords = dbSeoKeywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
      }
    }

    return json({
      music: {
        playlistId: appleMusicPlaylistUrl,
        playlistName: appleMusicPlaylistName,
      },
      photoAlbum: {
        albumUrl: iCloudPhotosAlbumUrl,
      },
      seo: {
        title: seoTitle,
        description: seoDescription,
        keywords: seoKeywords,
      },
    });
  } catch (err) {
    console.error('[api/content/config] Unexpected error:', err);
    console.error('[api/content/config] Error stack:', err instanceof Error ? err.stack : 'No stack trace');
    return error('Internal server error', 500);
  }
};

