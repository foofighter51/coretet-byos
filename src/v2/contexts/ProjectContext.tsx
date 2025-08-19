import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import {
  Project,
  SongVersion,
  VersionIteration,
  ProjectCollaborator,
  VersionMetadata,
  CreateProjectInput,
  UpdateProjectInput,
  CreateVersionInput,
  CreateIterationInput,
  ProjectWithRelations,
  VersionWithRelations
} from '../types/project.types';

// ============================================================================
// Context Types
// ============================================================================

interface ProjectContextType {
  // State
  projects: Project[];
  currentProject: ProjectWithRelations | null;
  currentVersion: VersionWithRelations | null;
  loading: boolean;
  error: string | null;
  
  // Project CRUD
  createProject: (input: CreateProjectInput) => Promise<Project>;
  updateProject: (id: string, input: UpdateProjectInput) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  fetchProjects: () => Promise<void>;
  fetchProject: (id: string) => Promise<void>;
  setCurrentProject: (project: ProjectWithRelations | null) => void;
  
  // Version CRUD
  createVersion: (input: CreateVersionInput) => Promise<SongVersion>;
  updateVersion: (id: string, updates: Partial<SongVersion>) => Promise<void>;
  deleteVersion: (id: string) => Promise<void>;
  setCurrentVersion: (version: VersionWithRelations | null) => void;
  
  // Iteration CRUD
  createIteration: (input: CreateIterationInput) => Promise<VersionIteration>;
  updateIteration: (id: string, updates: Partial<VersionIteration>) => Promise<void>;
  deleteIteration: (id: string) => Promise<void>;
  selectIteration: (id: string) => Promise<void>;
  
  // Version utilities
  getVersions: (projectId: string) => Promise<SongVersion[]>;
  getIterations: (versionId: string) => Promise<VersionIteration[]>;
  
  // Collaboration
  inviteCollaborator: (projectId: string, email: string, role: string) => Promise<void>;
  removeCollaborator: (projectId: string, userId: string) => Promise<void>;
  updateCollaboratorRole: (projectId: string, userId: string, role: string) => Promise<void>;
  
  // Migration
  migratePlaylistToProject: (playlistId: string) => Promise<string>;
  
  // Utilities
  getNextVersionNumber: (projectId: string) => string;
  getNextIterationNumber: (versionId: string) => Promise<number>;
}

// ============================================================================
// Context Creation
// ============================================================================

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<ProjectWithRelations | null>(null);
  const [currentVersion, setCurrentVersion] = useState<VersionWithRelations | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // Project CRUD Operations
  // ============================================================================

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Fetching projects for user:', user.id);
      
      // Check both projects and tracks tables for debugging
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id);
        
      const { data: tracksData, error: tracksError } = await supabase
        .from('tracks')
        .select('*')
        .eq('user_id', user.id);
      
      console.log('📊 Database results:', {
        projects: { count: projectsData?.length || 0, data: projectsData },
        tracks: { count: tracksData?.length || 0, data: tracksData?.slice(0, 3) }, // Show first 3
        projectsError,
        tracksError
      });
      
      // For now, continue with projects query
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setProjects(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch projects';
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  const fetchProject = useCallback(async (id: string) => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Simplified - fetch project without complex joins
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();
      
      if (projectError) throw projectError;
      
      setCurrentProject(project as ProjectWithRelations);
      
      // Set primary version as current if exists
      const primaryVersion = project?.versions?.find(v => v.is_primary);
      if (primaryVersion) {
        setCurrentVersion(primaryVersion as VersionWithRelations);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch project';
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  const createProject = useCallback(async (input: CreateProjectInput): Promise<Project> => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...input,
          user_id: user.id,
          status: 'active' // Default status for new works
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Create initial version
      await supabase
        .from('song_versions')
        .insert({
          project_id: data.id,
          user_id: user.id,
          name: 'Version 1',
          version_number: '1.0.0',
          is_primary: true
        });
      
      setProjects(prev => [data, ...prev]);
      showToast('Project created successfully', 'success');
      
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create project';
      setError(message);
      showToast(message, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  const updateProject = useCallback(async (id: string, input: UpdateProjectInput) => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('projects')
        .update(input)
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setProjects(prev => prev.map(p => 
        p.id === id ? { ...p, ...input, updated_at: new Date().toISOString() } : p
      ));
      
      if (currentProject?.id === id) {
        setCurrentProject(prev => prev ? { ...prev, ...input } : null);
      }
      
      showToast('Project updated', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update project';
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [user, currentProject, showToast]);

  const deleteProject = useCallback(async (id: string) => {
    if (!user) return;
    
    if (!confirm('Are you sure? This will delete all versions and iterations.')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setProjects(prev => prev.filter(p => p.id !== id));
      
      if (currentProject?.id === id) {
        setCurrentProject(null);
        setCurrentVersion(null);
      }
      
      showToast('Project deleted', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete project';
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [user, currentProject, showToast]);

  // ============================================================================
  // Version CRUD Operations
  // ============================================================================

  const createVersion = useCallback(async (input: CreateVersionInput): Promise<SongVersion> => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('song_versions')
        .insert({
          ...input,
          user_id: user.id
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Refresh current project to get new version
      if (currentProject?.id === input.project_id) {
        await fetchProject(input.project_id);
      }
      
      showToast('Version created', 'success');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create version';
      setError(message);
      showToast(message, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, currentProject, fetchProject, showToast]);

  const updateVersion = useCallback(async (id: string, updates: Partial<SongVersion>) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('song_versions')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state if this is the current version
      if (currentVersion?.id === id) {
        setCurrentVersion(prev => prev ? { ...prev, ...updates } : null);
      }
      
      showToast('Version updated', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update version';
      showToast(message, 'error');
    }
  }, [user, currentVersion, showToast]);

  const deleteVersion = useCallback(async (id: string) => {
    if (!user) return;
    
    if (!confirm('Delete this version and all its iterations?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('song_versions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Refresh project
      if (currentProject) {
        await fetchProject(currentProject.id);
      }
      
      showToast('Version deleted', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete version';
      showToast(message, 'error');
    }
  }, [user, currentProject, fetchProject, showToast]);

  // ============================================================================
  // Iteration CRUD Operations
  // ============================================================================

  const createIteration = useCallback(async (input: CreateIterationInput): Promise<VersionIteration> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      // Get next iteration number
      const iterationNumber = await getNextIterationNumber(input.version_id);
      
      const { data, error } = await supabase
        .from('version_iterations')
        .insert({
          ...input,
          user_id: user.id,
          iteration_number: iterationNumber
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Refresh current version
      if (currentVersion?.id === input.version_id) {
        // Fetch updated version
        const { data: version } = await supabase
          .from('song_versions')
          .select(`
            *,
            iterations:version_iterations(*),
            version_metadata(*)
          `)
          .eq('id', input.version_id)
          .single();
        
        if (version) {
          setCurrentVersion(version as VersionWithRelations);
        }
      }
      
      showToast('Iteration created', 'success');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create iteration';
      showToast(message, 'error');
      throw err;
    }
  }, [user, currentVersion, showToast]);

  const updateIteration = useCallback(async (id: string, updates: Partial<VersionIteration>) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('version_iterations')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
      
      showToast('Iteration updated', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update iteration';
      showToast(message, 'error');
    }
  }, [user, showToast]);

  const deleteIteration = useCallback(async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('version_iterations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      showToast('Iteration deleted', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete iteration';
      showToast(message, 'error');
    }
  }, [user, showToast]);

  const selectIteration = useCallback(async (id: string) => {
    if (!user || !currentVersion) return;
    
    try {
      // Deselect all iterations for this version
      await supabase
        .from('version_iterations')
        .update({ is_selected: false })
        .eq('version_id', currentVersion.id);
      
      // Select the specified iteration
      await supabase
        .from('version_iterations')
        .update({ is_selected: true })
        .eq('id', id);
      
      showToast('Iteration selected', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to select iteration';
      showToast(message, 'error');
    }
  }, [user, currentVersion, showToast]);

  // ============================================================================
  // Collaboration Operations
  // ============================================================================

  const inviteCollaborator = useCallback(async (projectId: string, email: string, role: string) => {
    if (!user) return;
    
    try {
      // Find user by email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();
      
      if (userError) throw new Error('User not found');
      
      const { error } = await supabase
        .from('project_collaborators')
        .insert({
          project_id: projectId,
          user_id: userData.id,
          role,
          invited_by: user.id
        });
      
      if (error) throw error;
      
      showToast('Collaborator invited', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to invite collaborator';
      showToast(message, 'error');
    }
  }, [user, showToast]);

  const removeCollaborator = useCallback(async (projectId: string, userId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('project_collaborators')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      showToast('Collaborator removed', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove collaborator';
      showToast(message, 'error');
    }
  }, [user, showToast]);

  const updateCollaboratorRole = useCallback(async (projectId: string, userId: string, role: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('project_collaborators')
        .update({ role })
        .eq('project_id', projectId)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      showToast('Role updated', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update role';
      showToast(message, 'error');
    }
  }, [user, showToast]);

  // ============================================================================
  // Version Utility Operations
  // ============================================================================

  const getVersions = useCallback(async (projectId: string): Promise<SongVersion[]> => {
    try {
      const { data, error } = await supabase
        .from('song_versions')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching versions:', err);
      return [];
    }
  }, []);

  const getIterations = useCallback(async (versionId: string): Promise<VersionIteration[]> => {
    try {
      const { data, error } = await supabase
        .from('version_iterations')
        .select('*')
        .eq('version_id', versionId)
        .order('iteration_number', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching iterations:', err);
      return [];
    }
  }, []);

  // ============================================================================
  // Migration Operations
  // ============================================================================

  const migratePlaylistToProject = useCallback(async (playlistId: string): Promise<string> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const { data, error } = await supabase
        .rpc('migrate_playlist_to_project', { p_playlist_id: playlistId });
      
      if (error) throw error;
      
      await fetchProjects();
      showToast('Playlist migrated to project', 'success');
      
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to migrate playlist';
      showToast(message, 'error');
      throw err;
    }
  }, [user, fetchProjects, showToast]);

  // ============================================================================
  // Utility Functions
  // ============================================================================

  const getNextVersionNumber = useCallback((projectId: string): string => {
    if (!currentProject || currentProject.id !== projectId) return '1.0.0';
    
    const versions = currentProject.versions || [];
    if (versions.length === 0) return '1.0.0';
    
    // Parse version numbers and find the highest
    const versionNumbers = versions.map(v => {
      const parts = v.version_number.split('.').map(Number);
      return { major: parts[0] || 1, minor: parts[1] || 0, patch: parts[2] || 0 };
    });
    
    const latest = versionNumbers.reduce((max, v) => {
      if (v.major > max.major) return v;
      if (v.major === max.major && v.minor > max.minor) return v;
      if (v.major === max.major && v.minor === max.minor && v.patch > max.patch) return v;
      return max;
    });
    
    // Increment minor version by default
    return `${latest.major}.${latest.minor + 1}.0`;
  }, [currentProject]);

  const getNextIterationNumber = useCallback(async (versionId: string): Promise<number> => {
    try {
      const { data, error } = await supabase
        .from('version_iterations')
        .select('iteration_number')
        .eq('version_id', versionId)
        .order('iteration_number', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      
      const highest = data && data.length > 0 ? data[0].iteration_number : 0;
      return highest + 1;
    } catch (err) {
      console.error('Error getting next iteration number:', err);
      return 1;
    }
  }, []);

  // ============================================================================
  // Effects
  // ============================================================================

  // Fetch projects on mount and user change
  useEffect(() => {
    if (user) {
      fetchProjects();
    } else {
      setProjects([]);
      setCurrentProject(null);
      setCurrentVersion(null);
    }
  }, [user, fetchProjects]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) return;
    
    const subscription = supabase
      .channel('projects')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Refresh projects on any change
          fetchProjects();
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [user, fetchProjects]);

  // ============================================================================
  // Context Value
  // ============================================================================

  const value: ProjectContextType = {
    // State
    projects,
    currentProject,
    currentVersion,
    loading,
    error,
    
    // Project CRUD
    createProject,
    updateProject,
    deleteProject,
    fetchProjects,
    fetchProject,
    setCurrentProject,
    
    // Version CRUD
    createVersion,
    updateVersion,
    deleteVersion,
    setCurrentVersion,
    
    // Iteration CRUD
    createIteration,
    updateIteration,
    deleteIteration,
    selectIteration,
    
    // Version utilities
    getVersions,
    getIterations,
    
    // Collaboration
    inviteCollaborator,
    removeCollaborator,
    updateCollaboratorRole,
    
    // Migration
    migratePlaylistToProject,
    
    // Utilities
    getNextVersionNumber,
    getNextIterationNumber
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

// ============================================================================
// Hook to use the context
// ============================================================================

export function useProjects() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
}