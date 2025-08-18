import React, { useState } from 'react';
import { Database, CheckCircle, XCircle, AlertTriangle, ExternalLink, Copy } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

export function DatabaseSetup() {
  const [isChecking, setIsChecking] = useState(false);
  const [status, setStatus] = useState<{
    v1Tables: { [key: string]: boolean };
    v2Tables: { [key: string]: boolean };
    message: string;
  } | null>(null);

  const checkDatabaseStatus = async () => {
    setIsChecking(true);
    
    const v1Tables = {
      'profiles': false,
      'tracks': false,
      'playlists': false,
      'playlist_tracks': false
    };
    
    const v2Tables = {
      'projects': false,
      'song_versions': false,
      'version_iterations': false,
      'version_metadata': false,
      'project_collaborators': false
    };

    // Check V1 tables
    for (const table of Object.keys(v1Tables)) {
      try {
        await supabase.from(table).select('id').limit(1);
        v1Tables[table] = true;
      } catch (error) {
        v1Tables[table] = false;
      }
    }

    // Check V2 tables  
    for (const table of Object.keys(v2Tables)) {
      try {
        await supabase.from(table).select('id').limit(1);
        v2Tables[table] = true;
      } catch (error) {
        v2Tables[table] = false;
      }
    }

    const v1Count = Object.values(v1Tables).filter(Boolean).length;
    const v2Count = Object.values(v2Tables).filter(Boolean).length;
    
    let message = '';
    if (v2Count === 0) {
      message = '⚠️ V2 tables missing - Database setup required';
    } else if (v2Count === 5) {
      message = '✅ All V2 tables exist - Database ready!';
    } else {
      message = `⚠️ Partial V2 setup - ${v2Count}/5 tables exist`;
    }

    setStatus({ v1Tables, v2Tables, message });
    setIsChecking(false);
  };

  const copySQL = () => {
    // This would copy the SQL content to clipboard
    navigator.clipboard.writeText('-- See database/v2_complete_schema.sql file for complete setup');
  };

  const projectId = 'vqkpdfkevjtdloldmqcb'; // Extract from SUPABASE_URL
  const dashboardUrl = `https://supabase.com/dashboard/project/${projectId}/sql`;

  return (
    <div className="bg-forest-main border border-forest-light rounded-xl p-6">
      <div className="flex items-center space-x-3 mb-4">
        <Database className="w-6 h-6 text-accent-yellow" />
        <h3 className="font-anton text-xl text-silver">Database Setup</h3>
      </div>

      <div className="space-y-4">
        <p className="font-quicksand text-sm text-silver/80">
          Check and setup V2 database tables for the works-based architecture.
        </p>

        <button
          onClick={checkDatabaseStatus}
          disabled={isChecking}
          className="px-4 py-2 bg-accent-yellow text-forest-main font-quicksand font-semibold rounded-lg hover:bg-accent-yellow/90 disabled:opacity-50"
        >
          {isChecking ? 'Checking...' : 'Check Database Status'}
        </button>

        {status && (
          <div className="space-y-4">
            <div className="p-4 bg-forest-dark rounded-lg">
              <p className="font-quicksand text-sm text-silver mb-2">{status.message}</p>
              
              <div className="grid md:grid-cols-2 gap-4 mt-3">
                <div>
                  <h4 className="font-quicksand text-sm font-semibold text-silver mb-2">V1 Tables:</h4>
                  {Object.entries(status.v1Tables).map(([table, exists]) => (
                    <div key={table} className="flex items-center space-x-2 text-sm">
                      {exists ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                      <span className="font-quicksand text-silver">{table}</span>
                    </div>
                  ))}
                </div>

                <div>
                  <h4 className="font-quicksand text-sm font-semibold text-silver mb-2">V2 Tables:</h4>
                  {Object.entries(status.v2Tables).map(([table, exists]) => (
                    <div key={table} className="flex items-center space-x-2 text-sm">
                      {exists ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                      <span className="font-quicksand text-silver">{table}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {Object.values(status.v2Tables).some(exists => !exists) && (
              <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-quicksand text-sm text-orange-300 mb-3">
                      V2 tables need to be created. Follow these steps:
                    </p>
                    <ol className="font-quicksand text-sm text-orange-200 space-y-1 list-decimal list-inside">
                      <li>Open the Supabase Dashboard</li>
                      <li>Go to SQL Editor</li>
                      <li>Copy the SQL from database/v2_complete_schema.sql</li>
                      <li>Run the SQL to create V2 tables</li>
                      <li>Come back and check status again</li>
                    </ol>
                    <div className="flex items-center space-x-2 mt-3">
                      <a
                        href={dashboardUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 px-3 py-1 bg-orange-500/20 text-orange-300 rounded-lg hover:bg-orange-500/30 transition-colors text-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Open SQL Editor</span>
                      </a>
                      <button
                        onClick={copySQL}
                        className="flex items-center space-x-2 px-3 py-1 bg-orange-500/20 text-orange-300 rounded-lg hover:bg-orange-500/30 transition-colors text-sm"
                      >
                        <Copy className="w-4 h-4" />
                        <span>Copy Info</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}