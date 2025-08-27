import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getStreamingUrl } from '../utils/getStreamingUrl';

interface UrlCache {
  [trackId: string]: {
    url: string;
    expires: number;
  };
}

const urlCache: UrlCache = {};

export function useSecureTrackUrl(trackId: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!trackId) {
      setUrl(null);
      return;
    }

    // Check cache first
    const cached = urlCache[trackId];
    if (cached && cached.expires > Date.now()) {
      setUrl(cached.url);
      return;
    }

    // Fetch new URL
    const fetchUrl = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get track from database
        const { data: track, error: trackError } = await supabase
          .from('tracks')
          .select('id, storage_path, provider_url, url')
          .eq('id', trackId)
          .single();

        if (trackError) throw trackError;

        // Use the centralized getStreamingUrl function
        const finalUrl = await getStreamingUrl(track);

        if (finalUrl) {
          // Cache for 50 minutes (URLs expire in 60)
          urlCache[trackId] = {
            url: finalUrl,
            expires: Date.now() + 50 * 60 * 1000
          };
          setUrl(finalUrl);
        } else {
          throw new Error('No URL returned');
        }
      } catch (err) {
        // Error fetching track URL
        setError(err instanceof Error ? err.message : 'Failed to get URL');
        setUrl(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUrl();
  }, [trackId]);

  return { url, loading, error };
}

// Batch URL fetcher for efficiency
export async function fetchTrackUrls(trackIds: string[]): Promise<Record<string, string>> {
  if (trackIds.length === 0) return {};

  // Filter out already cached URLs
  const now = Date.now();
  const cachedUrls: Record<string, string> = {};
  const uncachedIds: string[] = [];

  for (const id of trackIds) {
    const cached = urlCache[id];
    if (cached && cached.expires > now) {
      cachedUrls[id] = cached.url;
    } else {
      uncachedIds.push(id);
    }
  }

  // If all are cached, return immediately
  if (uncachedIds.length === 0) {
    return cachedUrls;
  }

  try {
    // Get tracks from database
    const { data: tracks, error: tracksError } = await supabase
      .from('tracks')
      .select('id, storage_path, provider_url, url')
      .in('id', uncachedIds);

    if (tracksError) {
      throw tracksError;
    }

    // Generate URLs for each track using centralized function
    const urls: Record<string, string> = {};
    
    for (const track of tracks || []) {
      const url = await getStreamingUrl(track);
      if (url) {
        urls[track.id] = url;
      }
    }
    
    // Cache the new URLs
    const expiresAt = Date.now() + 50 * 60 * 1000;
    for (const [id, url] of Object.entries(urls)) {
      urlCache[id] = {
        url: url as string,
        expires: expiresAt
      };
    }

    // Final URLs prepared
    return { ...cachedUrls, ...urls };
  } catch (error) {
    // Error fetching track URLs
    return cachedUrls; // Return what we have cached
  }
}