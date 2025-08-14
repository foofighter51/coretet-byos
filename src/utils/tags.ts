export const PREDEFINED_TAGS = [
  // Genres
  'pop', 'rock', 'electronic', 'hip-hop', 'jazz', 'classical', 'folk', 'country', 'r&b', 'indie',
  'metal', 'punk', 'reggae', 'blues', 'funk', 'disco', 'house', 'techno', 'ambient', 'experimental',
  
  // Moods & Energy
  'upbeat', 'chill', 'energetic', 'mellow', 'dark', 'bright', 'emotional', 'happy', 'sad', 'nostalgic',
  'aggressive', 'peaceful', 'dreamy', 'intense', 'relaxing', 'motivational', 'romantic', 'mysterious',
  
  // Instruments & Elements
  'guitar', 'piano', 'drums', 'bass', 'vocals', 'synth', 'strings', 'brass', 'acoustic', 'electric',
  'instrumental', 'vocal-heavy', 'percussion', 'electronic-beats', 'live-recording', 'studio',
  
  // Production & Style
  'lo-fi', 'hi-fi', 'reverb-heavy', 'dry', 'compressed', 'dynamic', 'minimal', 'layered', 'raw', 'polished',
  'vintage', 'modern', 'retro', 'futuristic', 'organic', 'synthetic'
];

export const getTagColor = (tag: string): string => {
  // Generate consistent colors based on tag name
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500',
    'bg-yellow-500', 'bg-red-500', 'bg-teal-500', 'bg-orange-500', 'bg-cyan-500'
  ];
  
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};