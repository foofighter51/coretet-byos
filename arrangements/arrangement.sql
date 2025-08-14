-- Audio sections table
CREATE TABLE audio_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_time DECIMAL(10,2) NOT NULL,
  end_time DECIMAL(10,2) NOT NULL,
  color_index INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Arrangements table
CREATE TABLE arrangements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id),
  is_original BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Arrangement sections junction table
CREATE TABLE arrangement_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arrangement_id UUID REFERENCES arrangements(id) ON DELETE CASCADE,
  section_id UUID REFERENCES audio_sections(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(arrangement_id, position)
);

-- Enable RLS
ALTER TABLE audio_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE arrangements ENABLE ROW LEVEL SECURITY;
ALTER TABLE arrangement_sections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audio_sections
-- Users can view sections for tracks they own or have access to via playlist shares
CREATE POLICY "Users can view audio sections" ON audio_sections
  FOR SELECT USING (
    EXISTS (
      -- User owns the track
      SELECT 1 FROM tracks t 
      WHERE t.id = audio_sections.track_id 
      AND t.user_id = auth.uid()
    )
    OR
    EXISTS (
      -- User has access via playlist share
      SELECT 1 FROM playlist_tracks pt
      JOIN playlist_shares ps ON pt.playlist_id = ps.playlist_id
      JOIN profiles p ON p.email = ps.shared_with_email
      WHERE pt.track_id = audio_sections.track_id
      AND p.id = auth.uid()
      AND ps.status = 'active'
    )
  );

-- Users can create sections for tracks they own or have edit permission via shares
CREATE POLICY "Users can create audio sections" ON audio_sections
  FOR INSERT WITH CHECK (
    EXISTS (
      -- User owns the track
      SELECT 1 FROM tracks t 
      WHERE t.id = audio_sections.track_id 
      AND t.user_id = auth.uid()
    )
    OR
    EXISTS (
      -- User has edit permission via playlist share
      SELECT 1 FROM playlist_tracks pt
      JOIN playlist_shares ps ON pt.playlist_id = ps.playlist_id
      JOIN profiles p ON p.email = ps.shared_with_email
      WHERE pt.track_id = audio_sections.track_id
      AND p.id = auth.uid()
      AND ps.status = 'active'
      AND ps.can_edit = true
    )
  );

-- Users can update sections they created
CREATE POLICY "Users can update own audio sections" ON audio_sections
  FOR UPDATE USING (created_by = auth.uid());

-- Users can delete sections they created
CREATE POLICY "Users can delete own audio sections" ON audio_sections
  FOR DELETE USING (created_by = auth.uid());

-- RLS Policies for arrangements
-- View policy: same as audio_sections
CREATE POLICY "Users can view arrangements" ON arrangements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tracks t 
      WHERE t.id = arrangements.track_id 
      AND t.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM playlist_tracks pt
      JOIN playlist_shares ps ON pt.playlist_id = ps.playlist_id
      JOIN profiles p ON p.email = ps.shared_with_email
      WHERE pt.track_id = arrangements.track_id
      AND p.id = auth.uid()
      AND ps.status = 'active'
    )
  );

-- Create policy: same as audio_sections
CREATE POLICY "Users can create arrangements" ON arrangements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tracks t 
      WHERE t.id = arrangements.track_id 
      AND t.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM playlist_tracks pt
      JOIN playlist_shares ps ON pt.playlist_id = ps.playlist_id
      JOIN profiles p ON p.email = ps.shared_with_email
      WHERE pt.track_id = arrangements.track_id
      AND p.id = auth.uid()
      AND ps.status = 'active'
      AND ps.can_edit = true
    )
  );

-- Update own arrangements
CREATE POLICY "Users can update own arrangements" ON arrangements
  FOR UPDATE USING (created_by = auth.uid());

-- Delete own non-original arrangements
CREATE POLICY "Users can delete own arrangements" ON arrangements
  FOR DELETE USING (created_by = auth.uid() AND is_original = false);

-- RLS Policies for arrangement_sections
-- View arrangement sections if user can view the arrangement
CREATE POLICY "Users can view arrangement sections" ON arrangement_sections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM arrangements a
      WHERE a.id = arrangement_sections.arrangement_id
      AND EXISTS (
        SELECT 1 FROM tracks t 
        WHERE t.id = a.track_id 
        AND t.user_id = auth.uid()
      )
    )
    OR
    EXISTS (
      SELECT 1 FROM arrangements a
      JOIN playlist_tracks pt ON a.track_id = pt.track_id
      JOIN playlist_shares ps ON pt.playlist_id = ps.playlist_id
      JOIN profiles p ON p.email = ps.shared_with_email
      WHERE a.id = arrangement_sections.arrangement_id
      AND p.id = auth.uid()
      AND ps.status = 'active'
    )
  );

-- Manage arrangement sections for own non-original arrangements
CREATE POLICY "Users can manage own arrangement sections" ON arrangement_sections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM arrangements a
      WHERE a.id = arrangement_sections.arrangement_id
      AND a.created_by = auth.uid()
      AND a.is_original = false
    )
  );

-- Create indexes for performance
CREATE INDEX idx_audio_sections_track_id ON audio_sections(track_id);
CREATE INDEX idx_audio_sections_created_by ON audio_sections(created_by);
CREATE INDEX idx_arrangements_track_id ON arrangements(track_id);
CREATE INDEX idx_arrangements_created_by ON arrangements(created_by);
CREATE INDEX idx_arrangement_sections_arrangement_id ON arrangement_sections(arrangement_id);
CREATE INDEX idx_arrangement_sections_position ON arrangement_sections(arrangement_id, position);