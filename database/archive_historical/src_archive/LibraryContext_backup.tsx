// Backup of the loadPlaylists section before modification
// Lines 380-463 from LibraryContext.tsx

const loadPlaylists = async () => {
    if (!user) return;

    try {
      // Check session before proceeding
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No active session when loading playlists');
        return;
      }
      
      // Loading playlists for user
      
      // Load playlists
      const { data: dbPlaylists, error: playlistError } = await supabase
        .from('playlists')
        .select('*')
        .eq('user_id', user.id)  // Explicitly filter by user
        .order('created_at', { ascending: false });

      if (playlistError) {
        console.error('Error loading playlists:', playlistError);
        // If table doesn't exist, just return empty array
        if (playlistError.code === '42P01') {
          // Playlists table not yet created
          setPlaylists([]);
          return;
        }
        // For permission errors, set empty and continue
        if (playlistError.code === '42501') {
          console.error('Permission denied loading playlists');
          setPlaylists([]);
          return;
        }
        throw playlistError;
      }

      // Load playlist tracks only for user's playlists
      let playlistTracks = null;
      if (dbPlaylists && dbPlaylists.length > 0) {
        const playlistIds = dbPlaylists.map(p => p.id);
        
        const { data, error: tracksError } = await supabase
          .from('playlist_tracks')
          .select('*')
          .in('playlist_id', playlistIds)
          .order('position', { ascending: true });

        if (tracksError) {
          console.error('Error loading playlist tracks:', tracksError);
          // If table doesn't exist, continue with empty tracks
          if (tracksError.code === '42P01') {
            // Playlist tracks table not yet created
            // Still format playlists but with empty track arrays
            playlistTracks = [];
          } else if (tracksError.code === '42501') {
            console.error('Permission denied loading playlist tracks');
            playlistTracks = [];
          } else {
            throw tracksError;
          }
        } else {
          playlistTracks = data;
        }
      }

      // Format playlists with their track IDs
      const formattedPlaylists: Playlist[] = (dbPlaylists || []).map(playlist => {
        const trackIds = (playlistTracks || [])
          .filter(pt => pt.playlist_id === playlist.id)
          .map(pt => pt.track_id);

        return {
          id: playlist.id,
          name: playlist.name,
          description: playlist.description,
          trackIds,
          createdAt: new Date(playlist.created_at),
          updatedAt: new Date(playlist.updated_at),
        };
      });

      setPlaylists(formattedPlaylists);
    } catch (error) {
      console.error('Error loading playlists:', error);
      // Set empty array on error to prevent UI issues
      setPlaylists([]);
    }
  };