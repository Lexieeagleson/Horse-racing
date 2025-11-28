import { useState, useRef, useCallback } from 'react';
import './avatarSelector.css';

// Preset avatar icons (emoji-based for simplicity)
const PRESET_AVATARS = [
  '🐎', '🏇', '🦄', '🐴', '🐪', '🦙', '🐘', '🦒',
  '🐕', '🐈', '🦊', '🐺', '🦁', '🐯', '🐻', '🐼'
];

const PRESET_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1'
];

const AvatarSelector = ({ currentAvatar, onSelect, onClose }) => {
  const [selectedTab, setSelectedTab] = useState('preset');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const fileInputRef = useRef(null);

  const handleFileUpload = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      // Create canvas for resizing/cropping
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 128; // Output size
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Calculate crop dimensions for 1:1 aspect ratio
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;

        // Draw circular clip
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // Draw image
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/png');
        setUploadedImage(dataUrl);
        setSelectedPreset(null);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }, []);

  const handlePresetSelect = useCallback((emoji, color) => {
    // Create canvas with emoji avatar
    const canvas = document.createElement('canvas');
    const size = 128;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Draw background circle
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw emoji
    ctx.font = `${size * 0.6}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, size / 2, size / 2 + 5);

    const dataUrl = canvas.toDataURL('image/png');
    setSelectedPreset({ emoji, color, dataUrl });
    setUploadedImage(null);
  }, []);

  const handleConfirm = useCallback(() => {
    if (uploadedImage) {
      onSelect(uploadedImage);
    } else if (selectedPreset) {
      onSelect(selectedPreset.dataUrl);
    }
    onClose();
  }, [uploadedImage, selectedPreset, onSelect, onClose]);

  const currentSelection = uploadedImage || selectedPreset?.dataUrl || currentAvatar;

  return (
    <div className="avatar-selector-overlay" onClick={onClose}>
      <div className="avatar-selector-modal" onClick={e => e.stopPropagation()}>
        <h2>Choose Your Avatar</h2>
        
        {/* Preview */}
        <div className="avatar-preview">
          {currentSelection ? (
            <img src={currentSelection} alt="Preview" />
          ) : (
            <div className="avatar-placeholder">?</div>
          )}
        </div>

        {/* Tabs */}
        <div className="avatar-tabs">
          <button 
            className={selectedTab === 'preset' ? 'active' : ''}
            onClick={() => setSelectedTab('preset')}
          >
            Presets
          </button>
          <button 
            className={selectedTab === 'upload' ? 'active' : ''}
            onClick={() => setSelectedTab('upload')}
          >
            Upload
          </button>
        </div>

        {/* Tab content */}
        {selectedTab === 'preset' && (
          <div className="preset-section">
            <div className="color-picker">
              {PRESET_COLORS.map(color => (
                <button
                  key={color}
                  className={`color-option ${selectedColor === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
            <div className="preset-grid">
              {PRESET_AVATARS.map(emoji => (
                <button
                  key={emoji}
                  className={`preset-avatar ${selectedPreset?.emoji === emoji ? 'selected' : ''}`}
                  style={{ backgroundColor: selectedColor }}
                  onClick={() => handlePresetSelect(emoji, selectedColor)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'upload' && (
          <div className="upload-section">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <button 
              className="upload-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              📷 Choose Image
            </button>
            <p className="upload-hint">JPG or PNG, max 2MB</p>
          </div>
        )}

        {/* Actions */}
        <div className="avatar-actions">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button 
            className="confirm-btn"
            onClick={handleConfirm}
            disabled={!currentSelection}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarSelector;
