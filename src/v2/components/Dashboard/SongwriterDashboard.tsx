import React, { useState } from 'react';
import { Music2, Upload, Share2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CreateWorkModal from '../Works/CreateWorkModal';
import QuickUploadModal from '../Upload/QuickUploadModal';
import { V2Layout } from '../Layout/V2Layout';

/**
 * SongwriterDashboard - Band collaboration focused homepage
 * Primary actions: Share a Demo or Start a Song
 */
export default function SongwriterDashboard() {
  const navigate = useNavigate();
  const [showCreateWork, setShowCreateWork] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  

  return (
    <V2Layout title="" subtitle="">
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="max-w-4xl w-full">
          {/* Welcome Message */}
          <div className="text-center mb-8 sm:mb-12 px-4 sm:px-0">
            <h2 className="font-anton text-2xl sm:text-4xl text-silver mb-3 sm:mb-4">
              Ready to share with your band?
            </h2>
            <p className="font-quicksand text-silver/60 text-base sm:text-lg max-w-md sm:max-w-none mx-auto">
              Upload a demo to get feedback or start organizing a new song
            </p>
          </div>

          {/* Two Main Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 max-w-3xl mx-auto px-4 sm:px-0">
            {/* Share a Demo */}
            <button
              onClick={() => setShowUpload(true)}
              className="group bg-forest-main border-2 border-forest-light hover:border-accent-yellow rounded-xl p-6 sm:p-8 transition-all duration-300 hover:transform hover:scale-105 min-h-[200px] sm:min-h-[240px]"
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="w-20 h-20 bg-accent-yellow/20 rounded-full flex items-center justify-center group-hover:bg-accent-yellow/30 transition-colors">
                  <Upload className="w-10 h-10 text-accent-yellow" />
                </div>
                <h3 className="font-anton text-2xl text-silver">
                  Share a Demo
                </h3>
                <p className="font-quicksand text-silver/60 text-center">
                  Upload your recording and instantly share it with bandmates for feedback.
                </p>
                <div className="flex items-center space-x-2 text-accent-yellow opacity-0 group-hover:opacity-100 transition-opacity">
                  <Share2 className="w-4 h-4" />
                  <span className="font-quicksand text-sm">Choose Files</span>
                </div>
              </div>
            </button>

            {/* Start a Song */}
            <button
              onClick={() => setShowCreateWork(true)}
              className="group bg-forest-main border-2 border-forest-light hover:border-accent-coral rounded-xl p-6 sm:p-8 transition-all duration-300 hover:transform hover:scale-105 min-h-[200px] sm:min-h-[240px]"
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="w-20 h-20 bg-accent-coral/20 rounded-full flex items-center justify-center group-hover:bg-accent-coral/30 transition-colors">
                  <Music2 className="w-10 h-10 text-accent-coral" />
                </div>
                <h3 className="font-anton text-2xl text-silver">
                  Start a Song
                </h3>
                <p className="font-quicksand text-silver/60 text-center">
                  Begin organizing a new song. Add demos, lyrics, and collaborate with your band.
                </p>
                <div className="flex items-center space-x-2 text-accent-coral opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus className="w-4 h-4" />
                  <span className="font-quicksand text-sm">Create Song</span>
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
    </V2Layout>
  );
}