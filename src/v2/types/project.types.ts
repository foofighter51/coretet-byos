/**
 * TypeScript types for CoreTet V2 Project Hierarchy
 * These match the database schema we just created
 */

// ============================================================================
// Base Types
// ============================================================================

export type ProjectType = 'album' | 'ep' | 'single' | 'collection';
export type ProjectStatus = 'active' | 'archived' | 'completed';
export type VersionStatus = 'draft' | 'review' | 'approved' | 'released';
export type CollaboratorRole = 'owner' | 'editor' | 'commenter' | 'viewer';

// ============================================================================
// Database Table Types
// ============================================================================

/**
 * Project - Main container for songwriter projects/albums
 */
export interface Project {
  id: string;
  user_id: string;
  name: string;
  artist?: string | null;
  description?: string | null;
  cover_image_url?: string | null;
  project_type: ProjectType;
  status: ProjectStatus;
  target_release_date?: string | null;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
  settings?: {
    visibility?: 'private' | 'public' | 'unlisted';
    [key: string]: any;
  };
  
  // Relations (populated via joins)
  versions?: SongVersion[];
  collaborators?: ProjectCollaborator[];
  track_count?: number;
}

/**
 * SongVersion - Major versions of a song (v1, v2, acoustic, etc.)
 */
export interface SongVersion {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  version_number: string; // "1.0.0", "2.1.0"
  branch_name?: string | null; // "acoustic", "radio-edit"
  status: VersionStatus;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
  
  // Relations
  project?: Project;
  iterations?: VersionIteration[];
  version_metadata?: VersionMetadata;
}

/**
 * VersionIteration - Individual takes/attempts of a version
 */
export interface VersionIteration {
  id: string;
  version_id: string;
  track_id?: string | null;
  user_id: string;
  iteration_number: number;
  name?: string | null;
  notes?: string | null;
  is_selected: boolean;
  created_at: string;
  metadata?: Record<string, any>;
  
  // Relations
  version?: SongVersion;
  track?: any; // Will use existing Track type from V1
}

/**
 * ProjectCollaborator - Team members on projects
 */
export interface ProjectCollaborator {
  id: string;
  project_id: string;
  user_id: string;
  role: CollaboratorRole;
  permissions: {
    can_edit: boolean;
    can_delete: boolean;
    can_invite: boolean;
    [key: string]: boolean;
  };
  invited_by?: string | null;
  invited_at: string;
  accepted_at?: string | null;
  
  // Relations
  project?: Project;
  user?: any; // Will use existing Profile type from V1
}

/**
 * VersionMetadata - Lyrics, chords, notes for versions
 */
export interface VersionMetadata {
  id: string;
  version_id: string;
  lyrics?: string | null;
  chords?: string | null;
  song_structure?: string | null; // "Verse, Chorus, Verse, Chorus, Bridge, Chorus"
  tempo?: number | null;
  key?: string | null;
  time_signature?: string | null;
  genre?: string | null;
  mood?: string | null;
  tags?: string[] | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  
  // Relations
  version?: SongVersion;
}

// ============================================================================
// Form/Input Types
// ============================================================================

/**
 * For creating a new project
 */
export interface CreateProjectInput {
  name: string;
  artist?: string;
  description?: string;
  project_type?: ProjectType;
  status?: ProjectStatus;
  target_release_date?: string;
  cover_image_url?: string;
}

/**
 * For updating a project
 */
export interface UpdateProjectInput {
  name?: string;
  artist?: string;
  description?: string;
  project_type?: ProjectType;
  status?: ProjectStatus;
  target_release_date?: string;
  cover_image_url?: string;
  settings?: Record<string, any>;
}

/**
 * For creating a new version
 */
export interface CreateVersionInput {
  project_id: string;
  name: string;
  version_number: string;
  branch_name?: string;
  status?: VersionStatus;
  is_primary?: boolean;
}

/**
 * For creating a new iteration
 */
export interface CreateIterationInput {
  version_id: string;
  track_id?: string;
  name?: string;
  notes?: string;
  is_selected?: boolean;
}

// ============================================================================
// Query Response Types
// ============================================================================

/**
 * Project with all relations loaded
 */
export interface ProjectWithRelations extends Project {
  versions: SongVersion[];
  collaborators: ProjectCollaborator[];
  recent_tracks?: any[]; // Recent Track additions
}

/**
 * Version with all relations loaded
 */
export interface VersionWithRelations extends SongVersion {
  project: Project;
  iterations: VersionIteration[];
  version_metadata?: VersionMetadata;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * For version comparison
 */
export interface VersionComparison {
  version_a: VersionWithRelations;
  version_b: VersionWithRelations;
  differences: {
    metadata: string[];
    iterations: number;
    tracks: number;
  };
}

/**
 * For project statistics
 */
export interface ProjectStats {
  project_id: string;
  total_versions: number;
  total_iterations: number;
  total_tracks: number;
  collaborator_count: number;
  last_updated: string;
  days_active: number;
}