import React, { useState } from 'react';
import { PenTool, Upload, Music, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CreateWorkModal from '../Works/CreateWorkModal';
import QuickUploadModal from '../Upload/QuickUploadModal';
import { V2Layout } from '../Layout/V2Layout';

/**
 * SongwriterDashboard - The main entry point for songwriters
 * Two primary actions: Create a Work or Upload Audio
 */
export default function SongwriterDashboard() {
  const navigate = useNavigate();
  const [showCreateWork, setShowCreateWork] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  return (
    <div className="v2-layout bg-forest-dark">
      {/* Header with Navigation */}
      <header className="bg-forest-main border-b border-forest-light">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="font-anton text-2xl text-silver hover:text-white transition-colors"
          >
            CoreTet
          </button>
          
          {/* Navigation Links */}
          <nav className="flex items-center space-x-6">
            <button
              onClick={() => navigate('/works')}
              className="text-silver/60 hover:text-silver transition-colors font-quicksand text-sm"
            >
              View My Works
            </button>
            <span className="text-silver/20">•</span>
            <button
              onClick={() => navigate('/recent')}
              className="text-silver/60 hover:text-silver transition-colors font-quicksand text-sm"
            >
              Recent Activity
            </button>
            <span className="text-silver/20">•</span>
            <button
              onClick={() => navigate('/collaborations')}
              className="text-silver/60 hover:text-silver transition-colors font-quicksand text-sm"
            >
              Collaborations
            </button>
            <span className="text-silver/20">•</span>
            <button
              onClick={() => navigate('/storage')}
              className="text-silver/60 hover:text-silver transition-colors font-quicksand text-sm"
            >
              Storage Settings
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content - Centered Options */}
      <div className="v2-content v2-scrollable flex items-center justify-center p-6">
        <div className="max-w-4xl w-full">
          {/* Welcome Message */}
          <div className="text-center mb-12">
            <h2 className="font-anton text-4xl text-silver mb-4">
              What would you like to do?
            </h2>
            <p className="font-quicksand text-silver/60 text-lg">
              Start with a new song idea or add audio to your library
            </p>
          </div>

          {/* Two Main Actions */}
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Create a Work */}
            <button
              onClick={() => setShowCreateWork(true)}
              className="group bg-forest-main border-2 border-forest-light hover:border-accent-yellow rounded-xl p-8 transition-all duration-300 hover:transform hover:scale-105"
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="w-20 h-20 bg-accent-yellow/20 rounded-full flex items-center justify-center group-hover:bg-accent-yellow/30 transition-colors">
                  <PenTool className="w-10 h-10 text-accent-yellow" />
                </div>
                <h3 className="font-anton text-2xl text-silver">
                  Create a Work
                </h3>
                <p className="font-quicksand text-silver/60 text-center">
                  Start a new song with just a title. Add versions, demos, and ideas as you go.
                </p>
                <div className="flex items-center space-x-2 text-accent-yellow opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus className="w-4 h-4" />
                  <span className="font-quicksand text-sm">Start Creating</span>
                </div>
              </div>
            </button>

            {/* Upload Audio */}
            <button
              onClick={() => setShowUpload(true)}
              className="group bg-forest-main border-2 border-forest-light hover:border-accent-coral rounded-xl p-8 transition-all duration-300 hover:transform hover:scale-105"
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="w-20 h-20 bg-accent-coral/20 rounded-full flex items-center justify-center group-hover:bg-accent-coral/30 transition-colors">
                  <Upload className="w-10 h-10 text-accent-coral" />
                </div>
                <h3 className="font-anton text-2xl text-silver">
                  Upload Audio
                </h3>
                <p className="font-quicksand text-silver/60 text-center">
                  Add recordings, demos, or ideas to your library. Organize them into works later.
                </p>
                <div className="flex items-center space-x-2 text-accent-coral opacity-0 group-hover:opacity-100 transition-opacity">
                  <Music className="w-4 h-4" />
                  <span className="font-quicksand text-sm">Choose Files</span>
                </div>
              </div>
            </button>
          </div>

        </div>
      </div>

      {/* Modals */}
      {showCreateWork && (
        <CreateWorkModal onClose={() => setShowCreateWork(false)} />
      )}
      
      {showUpload && (
        <QuickUploadModal onClose={() => setShowUpload(false)} />
      )}
    </div>
  );
}