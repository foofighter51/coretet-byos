import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Track } from '../../types';
import { getExtendedValue, setExtendedValue, ExtendedMetadata } from '../../utils/metadataUtils';

interface ExpandedMetadataEditorProps {
  track: Track;
  editedTrack: Track;
  onFieldChange: (field: keyof Track | string, value: unknown) => void;
  isEditing: boolean;
}


// Extended metadata options
const scaleOptions = ['Major', 'Minor', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian', 'Locrian', 'Harmonic Minor', 'Melodic Minor'];
const energyOptions = ['1 - Very Low', '2 - Low', '3 - Medium Low', '4 - Medium', '5 - Medium High', '6 - High', '7 - Very High'];

const ExpandedMetadataEditor: React.FC<ExpandedMetadataEditorProps> = ({
  track,
  editedTrack,
  onFieldChange,
  isEditing
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    musicTheory: false,
    production: false,
    technical: false,
    rights: false,
    links: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };


  const handleExtendedFieldChange = (field: keyof ExtendedMetadata, value: string) => {
    const updatedNotes = setExtendedValue(editedTrack.notes, field, value);
    onFieldChange('notes', updatedNotes);
  };

  const renderField = (label: string, field: keyof ExtendedMetadata, options?: string[], type: string = 'text') => {
    const value = getExtendedValue(editedTrack.notes, field);
    
    if (!isEditing) {
      return (
        <div className="grid grid-cols-[120px_1fr] gap-2 items-baseline">
          <p className="font-quicksand text-xs text-silver/60 text-right">{label}:</p>
          <p className="font-quicksand text-sm text-silver">{value || '—'}</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
        <p className="font-quicksand text-xs text-silver/60 text-right">{label}:</p>
        {options ? (
          <select
            value={value}
            onChange={(e) => handleExtendedFieldChange(field, e.target.value)}
            className="bg-forest-light border border-forest-light rounded px-2 py-1 font-quicksand text-sm text-silver focus:outline-none focus:border-accent-yellow"
          >
            <option value="">Select {label.toLowerCase()}...</option>
            {options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => handleExtendedFieldChange(field, e.target.value)}
            placeholder={`Enter ${label.toLowerCase()}`}
            className="bg-forest-light border border-forest-light rounded px-2 py-1 font-quicksand text-sm text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow"
          />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Music Theory Section */}
      <div className="border border-forest-light rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('musicTheory')}
          className="w-full flex items-center justify-between p-3 hover:bg-forest-light/20 transition-colors"
        >
          <h4 className="font-quicksand text-sm font-semibold text-silver">Music Theory</h4>
          {expandedSections.musicTheory ? (
            <ChevronDown className="w-4 h-4 text-silver/60" />
          ) : (
            <ChevronRight className="w-4 h-4 text-silver/60" />
          )}
        </button>
        {expandedSections.musicTheory && (
          <div className="p-3 space-y-2 border-t border-forest-light">
            {renderField('Scale', 'scale', scaleOptions)}
            {renderField('Mode', 'mode')}
            {renderField('Energy Level', 'energyLevel', energyOptions)}
            {renderField('Instruments', 'instruments')}
            {renderField('Arrangement', 'arrangement')}
          </div>
        )}
      </div>

      {/* Production Section */}
      <div className="border border-forest-light rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('production')}
          className="w-full flex items-center justify-between p-3 hover:bg-forest-light/20 transition-colors"
        >
          <h4 className="font-quicksand text-sm font-semibold text-silver">Production Details</h4>
          {expandedSections.production ? (
            <ChevronDown className="w-4 h-4 text-silver/60" />
          ) : (
            <ChevronRight className="w-4 h-4 text-silver/60" />
          )}
        </button>
        {expandedSections.production && (
          <div className="p-3 space-y-2 border-t border-forest-light">
            {renderField('Producer', 'producer')}
            {renderField('Engineer', 'engineer')}
            {renderField('Studio', 'studio')}
            {renderField('Recording Date', 'recordingDate', undefined, 'date')}
            {renderField('Mix Engineer', 'mixingEngineer')}
            {renderField('Master Engineer', 'masteringEngineer')}
            {renderField('Session Musicians', 'sessionMusicians')}
          </div>
        )}
      </div>

      {/* Technical Details Section */}
      <div className="border border-forest-light rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('technical')}
          className="w-full flex items-center justify-between p-3 hover:bg-forest-light/20 transition-colors"
        >
          <h4 className="font-quicksand text-sm font-semibold text-silver">Technical Details</h4>
          {expandedSections.technical ? (
            <ChevronDown className="w-4 h-4 text-silver/60" />
          ) : (
            <ChevronRight className="w-4 h-4 text-silver/60" />
          )}
        </button>
        {expandedSections.technical && (
          <div className="p-3 space-y-2 border-t border-forest-light">
            {renderField('Sample Rate', 'sampleRate')}
            {renderField('Bit Rate', 'bitRate')}
            {renderField('File Format', 'fileFormat')}
            {renderField('Codec', 'codec')}
            {renderField('Channels', 'channels')}
            {renderField('Loudness (LUFS)', 'loudness')}
          </div>
        )}
      </div>

      {/* Rights & Licensing Section */}
      <div className="border border-forest-light rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('rights')}
          className="w-full flex items-center justify-between p-3 hover:bg-forest-light/20 transition-colors"
        >
          <h4 className="font-quicksand text-sm font-semibold text-silver">Rights & Licensing</h4>
          {expandedSections.rights ? (
            <ChevronDown className="w-4 h-4 text-silver/60" />
          ) : (
            <ChevronRight className="w-4 h-4 text-silver/60" />
          )}
        </button>
        {expandedSections.rights && (
          <div className="p-3 space-y-2 border-t border-forest-light">
            {renderField('ISRC', 'isrc')}
            {renderField('Publisher', 'publisher')}
            {renderField('Label', 'label')}
            {renderField('Copyright', 'copyright')}
            {renderField('License Type', 'licenseType')}
            {renderField('Rights Holder', 'rightsHolder')}
          </div>
        )}
      </div>

      {/* External Links Section */}
      <div className="border border-forest-light rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('links')}
          className="w-full flex items-center justify-between p-3 hover:bg-forest-light/20 transition-colors"
        >
          <h4 className="font-quicksand text-sm font-semibold text-silver">External Links</h4>
          {expandedSections.links ? (
            <ChevronDown className="w-4 h-4 text-silver/60" />
          ) : (
            <ChevronRight className="w-4 h-4 text-silver/60" />
          )}
        </button>
        {expandedSections.links && (
          <div className="p-3 space-y-2 border-t border-forest-light">
            {renderField('Spotify', 'spotifyUrl', undefined, 'url')}
            {renderField('Apple Music', 'appleMusicUrl', undefined, 'url')}
            {renderField('SoundCloud', 'soundcloudUrl', undefined, 'url')}
            {renderField('YouTube', 'youtubeUrl', undefined, 'url')}
            {renderField('Bandcamp', 'bandcampUrl', undefined, 'url')}
            {renderField('Website', 'websiteUrl', undefined, 'url')}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpandedMetadataEditor;