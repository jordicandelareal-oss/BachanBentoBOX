import React, { useRef } from 'react';
import { Camera, Trash2, Scan, Image as ImageIcon, Edit2, X } from 'lucide-react';
import './PhotoSelector.css';

/**
 * Unified Photo Selector Component
 * @param {string} imageUrl - Current image URL
 * @param {function} onUpload - Callback when a file is selected (receives file)
 * @param {function} onRemove - Callback to clear the image
 * @param {function} onNanaScan - Optional callback to start Nana Vision
 * @param {string} label - Optional label (e.g. "Foto del plato")
 * @param {boolean} isCircular - Whether to render as a circle (for lists) or rectangle (for forms)
 * @param {string} placeholder - Text to show when no image
 */
export default function PhotoSelector({ 
  imageUrl, 
  onUpload, 
  onRemove, 
  onNanaScan, 
  label, 
  isCircular = false,
  placeholder = "Añadir foto" 
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) onUpload(file);
    // Reset input value to allow selecting the same file again if needed
    e.target.value = '';
  };

  const triggerInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`photo-selector-container ${isCircular ? 'is-circular' : ''}`}>
      {label && <label className="form-label mb-2 block">{label}</label>}
      
      <div className={`photo-box ${imageUrl ? 'has-image' : 'is-empty'} ${isCircular ? 'aspect-square rounded-full' : 'rounded-2xl'}`}>
        <input 
          type="file" 
          accept="image/*" 
          style={{ display: 'none' }} 
          ref={fileInputRef} 
          onChange={handleFileChange} 
        />
        
        {imageUrl ? (
          <div className="image-wrapper group" onClick={triggerInput}>
            <img src={imageUrl} alt="Uploaded" className="selected-image" />
            <div className="image-overlay opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={24} className="text-white" />
            </div>
            <button 
              type="button" 
              onClick={(e) => { e.stopPropagation(); onRemove(); }} 
              className="floating-remove-btn"
              title="Eliminar foto"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="empty-state" onClick={triggerInput}>
            <div className="icon-wrapper">
              <ImageIcon size={isCircular ? 20 : 28} className="text-slate-300" />
            </div>
            {!isCircular && <span className="placeholder-text">{placeholder}</span>}
          </div>
        )}

        {onNanaScan && !imageUrl && (
          <button 
            type="button" 
            onClick={(e) => { e.stopPropagation(); onNanaScan(); }}
            className="nana-scan-badge"
            title="Escanear con Nana"
          >
            <Scan size={14} className="text-sky-400" />
            <span className="badge-text">Nana Scan</span>
          </button>
        )}
      </div>
    </div>
  );
}
