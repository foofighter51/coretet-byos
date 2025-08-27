import { supabase } from '../lib/supabase';

/**
 * Get the proper streaming URL for a track (Supabase storage only)
 */
export async function getStreamingUrl(track: { 
  id: string; 
  url?: string; 
  storage_path?: string;
  provider_url?: string;
  [key: string]: any; // Allow other fields
}): Promise<string | null> {
  // Debug info removed - function is working correctly
  
  // Extract storage_path from provider_url if storage_path is missing
  let storagePath = track.storage_path;
  if (!storagePath && track.provider_url?.includes('supabase.co') && track.provider_url.includes('/audio-files/')) {
    const urlParts = track.provider_url.split('/audio-files/');
    if (urlParts[1]) {
      storagePath = urlParts[1];
      console.log('📂 Extracted storage_path from provider_url:', storagePath);
    }
  }

  // If it's a Supabase track with storage_path, use signed URL
  if (track.provider_url?.includes('supabase.co') && storagePath) {
    console.log('🔗 Generating signed URL for storage_path:', storagePath);
    try {
      const { data: signedData, error: signedError } = await supabase.storage
        .from('audio-files')
        .createSignedUrl(storagePath, 3600); // 1 hour expiry
      
      if (signedData && !signedError) {
        console.log('✅ Signed URL generated successfully:', signedData.signedUrl);
        return signedData.signedUrl;
      } else {
        console.log('⚠️ Signed URL failed. Error:', signedError);
        console.log('🔄 Trying public URL as fallback...');
        // Fallback to public URL
        const { data } = supabase.storage
          .from('audio-files')
          .getPublicUrl(storagePath);
        console.log('📤 Public URL generated:', data.publicUrl);
        return data.publicUrl;
      }
    } catch (error) {
      console.error('❌ Error generating streaming URL:', error);
      return null;
    }
  }
  
  // For other tracks, use provider_url or url
  return track.provider_url || track.url || null;
}