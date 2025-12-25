import type { APIRoute } from 'astro';

const json = (data: unknown, status = 200) => 
  new Response(JSON.stringify(data), { 
    status, 
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    } 
  });

const bad = (message: string, status = 400) => json({ error: message }, status);

// Extract the album id from the provided albumUrl, fallback to default if missing
const DEFAULT_ALBUM_ID = 'B2EJtdOXm2MG2Rb';

function getAlbumIdFromUrl(albumUrl: string | undefined): string {
  if (!albumUrl) return DEFAULT_ALBUM_ID;
  // This will extract after the '#' (icloud.com/sharedalbum/#ID) or last '/' as a fallback.
  const hashMatch = albumUrl.match(/#([^?/]+)/);
  if (hashMatch) return hashMatch[1];
  const pathMatch = albumUrl.match(/\/([^/]+)\/?$/);
  return pathMatch ? pathMatch[1] : DEFAULT_ALBUM_ID;
}

export const POST: APIRoute = async ({ request }) => {
  let body: any;
  try {
    body = await request.json();
  } catch (e) {
    console.error('[photo-album] Invalid JSON', e);
    return bad('Invalid JSON', 400);
  }

  const { albumUrl } = body || {};

  if (!albumUrl || typeof albumUrl !== 'string') {
    return bad('Missing or invalid albumUrl', 400);
  }

  const ALBUM_ID = getAlbumIdFromUrl(albumUrl);
  const BASE_URL = `https://p107-sharedstreams.icloud.com/${ALBUM_ID}/sharedstreams`;

  console.log('[photo-album] Fetching album:', ALBUM_ID);

  try {
    // 1. Get the Stream (the list of photo identifiers)
    const streamResponse = await fetch(`${BASE_URL}/webstream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ streamGuid: ALBUM_ID }),
    });

    if (!streamResponse.ok) {
      const errorText = await streamResponse.text().catch(() => '');
      console.error('[photo-album] Stream fetch failed:', streamResponse.status, errorText);
      return bad(`Failed to fetch webstream: ${streamResponse.status} ${streamResponse.statusText}`, streamResponse.status);
    }

    const streamData = await streamResponse.json();
    console.log('[photo-album] Stream data received, photos count:', streamData.photos?.length || 0);

    if (!streamData.photos?.length) {
      console.warn('[photo-album] No photos in stream data:', JSON.stringify(streamData).substring(0, 200));
      return bad('No photos found in album', 404);
    }

    // Helper function to get the best available derivative dynamically
    // iCloud uses numeric derivatives (pixel widths) like '342', '2049', '1440', '2208'
    // Higher numbers typically mean better quality/resolution
    function getBestDerivative(derivatives: Record<string, any>): { key: string; checksum: string } | null {
      if (!derivatives || typeof derivatives !== 'object') {
        return null;
      }

      const available = Object.entries(derivatives)
        .filter(([_, value]) => value && value.checksum)
        .map(([key, value]) => {
          // Try to parse as number (numeric derivatives like '2049', '1440' are pixel widths)
          const numericValue = parseInt(key, 10);
          return {
            key,
            checksum: value.checksum,
            numericValue: isNaN(numericValue) ? 0 : numericValue,
            isNumeric: !isNaN(numericValue)
          };
        });

      if (available.length === 0) {
        return null;
      }

      // Sort to get the best quality:
      // 1. Prefer numeric derivatives (higher = better)
      // 2. For non-numeric, prefer known good names
      const sorted = available.sort((a, b) => {
        // Both numeric: prefer higher value
        if (a.isNumeric && b.isNumeric) {
          return b.numericValue - a.numericValue;
        }
        // Prefer numeric over non-numeric
        if (a.isNumeric && !b.isNumeric) return -1;
        if (!a.isNumeric && b.isNumeric) return 1;
        // Both non-numeric: prefer known good names
        const knownGood = ['PosterFrame', '720p', '1080p', '1280', '360p'];
        const aIndex = knownGood.indexOf(a.key);
        const bIndex = knownGood.indexOf(b.key);
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        // Otherwise, alphabetical
        return a.key.localeCompare(b.key);
      });

      return {
        key: sorted[0].key,
        checksum: sorted[0].checksum
      };
    }
    
    // Extract photo/video guids and map them to their checksums
    const photoMapping: Record<string, { checksum: string; derivative: string }> = {};
    
    const photoGuids = streamData.photos
      .map((p: any) => {
        if (!p.derivatives || !p.photoGuid) {
          return null;
        }

        const best = getBestDerivative(p.derivatives);

        if (best) {
          photoMapping[p.photoGuid] = {
            checksum: best.checksum,
            derivative: best.key
          };
          return p.photoGuid;
        }

        // Log available derivatives for debugging
        const available = Object.keys(p.derivatives);
        console.warn('[photo-album] No suitable derivative found for GUID:', p.photoGuid, 'Available:', available, 'Type:', p.type || p.assetType || 'unknown');
        return null;
      })
      .filter((guid: string | null) => guid !== null) as string[];

    console.log('[photo-album] Photo GUIDs extracted:', photoGuids.length);

    if (!photoGuids.length) {
      const sampleDerivatives = streamData.photos[0]?.derivatives ? Object.keys(streamData.photos[0].derivatives) : 'none';
      console.warn('[photo-album] No valid photos with any supported derivative. Available derivatives:', sampleDerivatives);
      return bad(`No valid photos found. Available derivatives: ${Array.isArray(sampleDerivatives) ? sampleDerivatives.join(', ') : sampleDerivatives}`, 404);
    }

    // 2. Get the actual Asset URLs (by photoGuids)
    const assetResponse = await fetch(`${BASE_URL}/webasseturls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ photoGuids }),
    });

    if (!assetResponse.ok) {
      const errorText = await assetResponse.text().catch(() => '');
      console.error('[photo-album] Asset fetch failed:', assetResponse.status, errorText);
      return bad(`Failed to fetch webasseturls: ${assetResponse.status} ${assetResponse.statusText}`, assetResponse.status);
    }

    const assetData = await assetResponse.json();
    console.log('[photo-album] Asset data received, items count:', Object.keys(assetData.items || {}).length);

    // 3. Build a lookup map for photos by GUID (optimize PosterFrame lookups)
    const photoByGuid = new Map<string, any>();
    streamData.photos.forEach((p: any) => {
      if (p.photoGuid) {
        photoByGuid.set(p.photoGuid, p);
      }
    });

    // 4. Build URLs using the checksum mapping and detect video type from URL extension
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v'];
    
    const mediaItems = photoGuids
      .map((guid: string) => {
        const mapping = photoMapping[guid];
        if (!mapping) {
          console.warn('[photo-album] No mapping found for GUID:', guid);
          return null;
        }

        const item = assetData.items?.[mapping.checksum];
        
        if (!item) {
          console.warn('[photo-album] No item for checksum:', mapping.checksum, '(GUID:', guid, ', derivative:', mapping.derivative, ')');
          return null;
        }

        // The item might contain scheme, host, path directly
        const scheme = item.url_scheme || 'https';
        const host = item.url_location;
        const path = item.url_path;
        
        if (host && path) {
          const fullUrl = `${scheme}://${host}${path}`;
          
          // Detect if this is a video by checking the file extension in the URL
          const urlLower = fullUrl.toLowerCase();
          const isVideo = videoExtensions.some(ext => urlLower.includes(ext));
          
          // For videos, try to find a PosterFrame thumbnail if available (optimized lookup)
          let thumbnail: string | undefined = undefined;
          if (isVideo) {
            // Use Map lookup instead of find() - O(1) instead of O(n)
            const originalPhoto = photoByGuid.get(guid);
            if (originalPhoto?.derivatives?.PosterFrame?.checksum) {
              const posterItem = assetData.items?.[originalPhoto.derivatives.PosterFrame.checksum];
              if (posterItem?.url_location && posterItem?.url_path) {
                const posterScheme = posterItem.url_scheme || 'https';
                thumbnail = `${posterScheme}://${posterItem.url_location}${posterItem.url_path}`;
              }
            }
            // If no PosterFrame found, use the video URL as thumbnail (browser will show first frame)
            if (!thumbnail) {
              thumbnail = fullUrl;
            }
          }
          
          return {
            url: fullUrl,
            isVideo: isVideo,
            thumbnail: thumbnail
          };
        }
        
        console.warn('[photo-album] Missing host or path for checksum:', mapping.checksum, '(derivative:', mapping.derivative, ')');
        return null;
      })
      .filter((item: any) => item !== null);

    console.log('[photo-album] Media items built:', mediaItems.length);
    const videoCount = mediaItems.filter((item: any) => item.isVideo).length;
    const photoCount = mediaItems.length - videoCount;
    console.log('[photo-album] Photos:', photoCount, 'Videos:', videoCount);

    if (!mediaItems.length) {
      console.error('[photo-album] No valid media URLs found. Sample asset data:', JSON.stringify(assetData).substring(0, 500));
      return bad('No valid media URLs found', 404);
    }

    return json({ photos: mediaItems });
  } catch (err: any) {
    console.error('[photo-album] Error fetching iCloud photos', err);
    return bad(err?.message || 'Unknown error occurred', 500);
  }
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};

export const GET: APIRoute = async () => json({ ok: true });

