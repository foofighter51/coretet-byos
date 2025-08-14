import React from 'react';
import { Play, Edit2, Trash2, Music } from 'lucide-react';
import { AudioSection } from '../../types';

interface SectionListProps {
  sections: AudioSection[];
  selectedSection: string | null;
  onSelectSection: (sectionId: string) => void;
  onUpdateSection: (section: AudioSection) => void;
  onDeleteSection: (sectionId: string) => void;
  onPlaySection: (section: AudioSection) => void;
}

const SECTION_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Green', value: '#10B981' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
];

const SectionList: React.FC<SectionListProps> = ({
  sections,
  selectedSection,
  onSelectSection,
  onUpdateSection,
  onDeleteSection,
  onPlaySection
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const getDuration = (section: AudioSection) => {
    const duration = section.end_time - section.start_time;
    return `${duration.toFixed(2)}s`;
  };

  if (sections.length === 0) {
    return null;
  }

  return (
    <div className="bg-forest-light/50 rounded-lg p-4">
      <h3 className="font-quicksand font-semibold text-silver mb-3">
        Sections ({sections.length})
      </h3>
      
      <div className="space-y-2">
        {sections.map((section) => {
          const currentColor = SECTION_COLORS.find(c => c.value === section.color) || SECTION_COLORS[0];
          const isSelected = selectedSection === section.id;
          
          return (
            <div
              key={section.id}
              onClick={() => onSelectSection(section.id)}
              className={`p-3 rounded-lg cursor-pointer transition-all ${
                isSelected 
                  ? 'bg-forest-main border-2' 
                  : 'bg-forest-main/50 border-2 border-transparent hover:bg-forest-main/80'
              }`}
              style={{
                borderColor: isSelected ? currentColor.value : 'transparent'
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: currentColor.value }}
                  />
                  <div>
                    <p className="font-medium text-silver">{section.name}</p>
                    <p className="text-xs text-silver/60">
                      {formatTime(section.start_time)} - {formatTime(section.end_time)} 
                      <span className="ml-2">({getDuration(section)})</span>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlaySection(section);
                    }}
                    className="p-1.5 hover:bg-forest-light rounded transition-colors"
                    title="Play section"
                  >
                    <Play className="w-4 h-4 text-silver/60" />
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Open color picker
                      const currentIndex = SECTION_COLORS.findIndex(c => c.value === section.color);
                      const nextIndex = (currentIndex + 1) % SECTION_COLORS.length;
                      onUpdateSection({ ...section, color: SECTION_COLORS[nextIndex].value });
                    }}
                    className="p-1.5 hover:bg-forest-light rounded transition-colors"
                    title="Change color"
                  >
                    <div
                      className="w-4 h-4 rounded border border-silver/40"
                      style={{ backgroundColor: currentColor.value }}
                    />
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete "${section.name}"?`)) {
                        onDeleteSection(section.id);
                      }
                    }}
                    className="p-1.5 hover:bg-forest-light rounded transition-colors"
                    title="Delete section"
                  >
                    <Trash2 className="w-4 h-4 text-accent-coral/60" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Section Templates */}
      <div className="mt-4 pt-4 border-t border-forest-light">
        <p className="text-xs text-silver/60 mb-2">Quick Templates:</p>
        <div className="flex flex-wrap gap-2">
          {['Intro', 'Verse', 'Chorus', 'Bridge', 'Outro'].map((template) => (
            <button
              key={template}
              className="px-3 py-1 bg-forest-main/50 hover:bg-forest-main text-xs text-silver/80 rounded"
              onClick={() => {
                // TODO: Implement template application
                // Apply template
              }}
            >
              {template}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SectionList;