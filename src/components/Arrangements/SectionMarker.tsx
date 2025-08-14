import React, { useState, useCallback } from 'react';
import { Music, Edit2, Trash2, Check, X } from 'lucide-react';
import { AudioSection } from '../../types';

interface SectionMarkerProps {
  section: AudioSection;
  totalDuration: number;
  containerWidth: number;
  onUpdate: (section: AudioSection) => void;
  onDelete: (sectionId: string) => void;
  isSelected: boolean;
  onSelect: () => void;
}

const SECTION_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Green', value: '#10B981' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
];

const SectionMarker: React.FC<SectionMarkerProps> = ({
  section,
  totalDuration,
  containerWidth,
  onUpdate,
  onDelete,
  isSelected,
  onSelect
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(section.name);
  
  const startX = (section.start_time / totalDuration) * containerWidth;
  const endX = (section.end_time / totalDuration) * containerWidth;
  const width = endX - startX;
  const currentColor = SECTION_COLORS.find(c => c.value === section.color) || SECTION_COLORS[0];

  const handleSave = useCallback(() => {
    if (editName.trim()) {
      onUpdate({ ...section, name: editName.trim() });
      setIsEditing(false);
    }
  }, [editName, section, onUpdate]);

  const handleCancel = useCallback(() => {
    setEditName(section.name);
    setIsEditing(false);
  }, [section.name]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`absolute top-0 h-full cursor-pointer transition-all ${
        isSelected ? 'z-20' : 'z-10'
      }`}
      style={{
        left: `${startX}px`,
        width: `${width}px`,
      }}
      onClick={onSelect}
    >
      {/* Section background */}
      <div
        className={`h-full border-2 ${
          isSelected ? 'border-opacity-100' : 'border-opacity-60'
        }`}
        style={{
          backgroundColor: `${currentColor.value}20`,
          borderColor: currentColor.value,
        }}
      >
        {/* Section header */}
        <div
          className="flex items-center justify-between px-2 py-1"
          style={{ backgroundColor: `${currentColor.value}40` }}
        >
          {isEditing ? (
            <div className="flex items-center space-x-1" onClick={e => e.stopPropagation()}>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') handleCancel();
                }}
                className="bg-forest-dark/80 text-silver px-1 py-0 text-xs rounded w-24"
                autoFocus
              />
              <button
                onClick={handleSave}
                className="p-0.5 hover:bg-forest-light/50 rounded"
              >
                <Check className="w-3 h-3 text-accent-yellow" />
              </button>
              <button
                onClick={handleCancel}
                className="p-0.5 hover:bg-forest-light/50 rounded"
              >
                <X className="w-3 h-3 text-silver/60" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center space-x-1">
                <Music className="w-3 h-3" style={{ color: currentColor.value }} />
                <span className="text-xs font-medium text-silver">
                  {section.name}
                </span>
              </div>
              {isSelected && (
                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditing(true);
                    }}
                    className="p-0.5 hover:bg-forest-light/50 rounded"
                  >
                    <Edit2 className="w-3 h-3 text-silver/60" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(section.id);
                    }}
                    className="p-0.5 hover:bg-forest-light/50 rounded"
                  >
                    <Trash2 className="w-3 h-3 text-accent-coral/60" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Time display */}
        {isSelected && (
          <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-forest-dark/80">
            <p className="text-xs text-silver/80">
              {formatTime(section.start_time)} - {formatTime(section.end_time)}
            </p>
          </div>
        )}
      </div>

      {/* Resize handles */}
      {isSelected && (
        <>
          <div
            className="absolute left-0 top-0 w-2 h-full cursor-ew-resize hover:bg-accent-yellow/50"
            onClick={e => e.stopPropagation()}
          />
          <div
            className="absolute right-0 top-0 w-2 h-full cursor-ew-resize hover:bg-accent-yellow/50"
            onClick={e => e.stopPropagation()}
          />
        </>
      )}
    </div>
  );
};

export default SectionMarker;