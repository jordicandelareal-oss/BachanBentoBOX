import React from 'react';
import { Camera, MessageSquare, X } from 'lucide-react';
import './AIActionSheet.css';

const SparkleAIIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3L14.5 9L21 11.5L14.5 14L12 21L9.5 14L3 11.5L9.5 9L12 3Z" fill="var(--color-accent)" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 3L19.5 5L21.5 5.5L19.5 6L19 8L18.5 6L16.5 5.5L18.5 5L19 3Z" fill="currentColor" />
  </svg>
);

export default function AIActionSheet({ isOpen, onClose, onSelectOption }) {
  if (!isOpen) return null;

  return (
    <div className="action-sheet-overlay" onClick={onClose}>
      <div className={`action-sheet-container ${isOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="action-sheet-header">
          <div className="action-sheet-handle"></div>
          <h3>CENTRO DE IA NANA</h3>
          <button className="action-sheet-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="action-sheet-options">
          <button className="action-option" onClick={() => { onSelectOption('vision'); onClose(); }}>
            <div className="option-icon-wrapper">
              <Camera size={24} />
            </div>
            <div className="option-text">
              <span className="option-title">Usar Cámara (Nana Vision)</span>
              <span className="option-subtitle">Identifica ingredientes y platos al instante</span>
            </div>
          </button>
          
          <button className="action-option" onClick={() => { onSelectOption('chat'); onClose(); }}>
            <div className="option-icon-wrapper">
              <SparkleAIIcon />
            </div>
            <div className="option-text">
              <span className="option-title">Consultar por Voz/Chat</span>
              <span className="option-subtitle">Pregunta lo que necesites a Nana</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
