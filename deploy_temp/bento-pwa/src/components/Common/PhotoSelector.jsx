import React, { useRef, useState } from 'react';
import { Camera, Trash2, Scan, Image as ImageIcon, Edit2, X } from 'lucide-react';
import ImageEditorModal from './ImageEditorModal';
import './PhotoSelector.css';

/**
 * Unified Photo Selector Component with built-in Editor
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
  const [editorImage, setEditorImage] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setEditorImage(url);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const handleEditorSave = (blob) => {
    // If we have a local URL from createObjectURL, we should revoke it eventually
    if (editorImage) URL.revokeObjectURL(editorImage);
    
    onUpload(blob);
    setEditorImage(null);
  };

  const handleEditorCancel = () => {
    if (editorImage) URL.revokeObjectURL(editorImage);
    setEditorImage(null);
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

      {editorImage && (
        <ImageEditorModal 
          image={editorImage} 
          onSave={handleEditorSave} 
          onCancel={handleEditorCancel} 
        />
      )}
    </div>
  );
}
