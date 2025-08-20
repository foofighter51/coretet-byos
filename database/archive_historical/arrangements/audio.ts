// types/audio.ts
export interface AudioSection {
  id: string;
  track_id: string;
  name: string;
  start_time: number;
  end_time: number;
  color_index?: number;
  created_by: string; // References profiles.id
  created_at: string;
  updated_at: string;
}

export interface Arrangement {
  id: string;
  track_id: string;
  name: string;
  created_by: string; // References profiles.id
  is_original: boolean;
  created_at: string;
  updated_at: string;
  arrangement_sections?: ArrangementSection[];
}

export interface ArrangementSection {
  id: string;
  arrangement_id: string;
  section_id: string;
  position: number;
  created_at: string;
  section?: AudioSection;
}