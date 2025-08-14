import { supabase } from '../lib/supabase';

export const getSignedUrl = async (path: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase.storage
      .from('audio-files')
      .createSignedUrl(path, 3600); // 1 hour expiry

    if (error) throw error;
    return data.signedUrl;
  } catch (error) {
    console.error('Error getting signed URL:', error);
    return null;
  }
};

export const getPublicUrl = (path: string): string => {
  const { data } = supabase.storage
    .from('audio-files')
    .getPublicUrl(path);
  
  return data.publicUrl;
};