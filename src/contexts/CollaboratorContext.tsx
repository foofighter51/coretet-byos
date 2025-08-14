import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface Collaborator {
  id: string;
  email: string;
  name: string;
}

interface CollaboratorContextType {
  collaborator: Collaborator | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, shareToken: string) => Promise<void>;
  logout: () => Promise<void>;
  validateToken: () => Promise<boolean>;
}

const CollaboratorContext = createContext<CollaboratorContextType | null>(null);

export const useCollaborator = () => {
  const context = useContext(CollaboratorContext);
  if (!context) {
    throw new Error('useCollaborator must be used within CollaboratorProvider');
  }
  return context;
};

const COLLABORATOR_TOKEN_KEY = 'coretet_collaborator_token';

export const CollaboratorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [collaborator, setCollaborator] = useState<Collaborator | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    validateToken();
  }, []);

  const validateToken = async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem(COLLABORATOR_TOKEN_KEY);
      if (!token) {
        setLoading(false);
        return false;
      }

      const { data, error } = await supabase.functions.invoke('collaborator-auth', {
        body: { action: 'validate', token },
      });

      if (error || !data.collaborator) {
        localStorage.removeItem(COLLABORATOR_TOKEN_KEY);
        setCollaborator(null);
        setLoading(false);
        return false;
      }

      setCollaborator(data.collaborator);
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      setLoading(false);
      return false;
    }
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.functions.invoke('collaborator-auth', {
      body: { action: 'login', email, password },
    });

    if (error) {
      throw new Error(error.message || 'Login failed');
    }

    if (!data.token || !data.collaborator) {
      throw new Error('Invalid response from server');
    }

    localStorage.setItem(COLLABORATOR_TOKEN_KEY, data.token);
    setCollaborator(data.collaborator);
  };

  const signup = async (email: string, password: string, name: string, shareToken: string) => {
    const { data, error } = await supabase.functions.invoke('collaborator-auth', {
      body: { action: 'signup', email, password, name, shareToken },
    });

    if (error) {
      throw new Error(error.message || 'Signup failed');
    }

    if (!data.token || !data.collaborator) {
      throw new Error('Invalid response from server');
    }

    localStorage.setItem(COLLABORATOR_TOKEN_KEY, data.token);
    setCollaborator(data.collaborator);
  };

  const logout = async () => {
    const token = localStorage.getItem(COLLABORATOR_TOKEN_KEY);
    if (token) {
      await supabase.functions.invoke('collaborator-auth', {
        body: { action: 'logout', token },
      });
    }
    
    localStorage.removeItem(COLLABORATOR_TOKEN_KEY);
    setCollaborator(null);
  };

  return (
    <CollaboratorContext.Provider
      value={{
        collaborator,
        loading,
        login,
        signup,
        logout,
        validateToken,
      }}
    >
      {children}
    </CollaboratorContext.Provider>
  );
};