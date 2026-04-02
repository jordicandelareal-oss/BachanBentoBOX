import React from 'react';
import { X } from 'lucide-react';
import './Lightbox.css';

export default function Lightbox({ isOpen, imageUrl, onClose, title }) {
  if (!isOpen || !imageUrl) return null;

  return (
    <div className="lightbox-backdrop" onClick={onClose}>
      <div className="lightbox-content" onClick={e => e.stopPropagation()}>
        <div className="lightbox-header">
          <h3 className="lightbox-title">{title}</h3>
          <button className="lightbox-close text-white" onClick={onClose}>
            <X size={28} />
          </button>
        </div>
        <div className="lightbox-image-wrapper">
          <img src={imageUrl} alt={title} className="lightbox-image" />
        </div>
      </div>
    </div>
  );
}
