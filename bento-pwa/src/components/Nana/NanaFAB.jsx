import React from 'react';
import './NanaFAB.css';

export default function NanaFAB({ onClick, onLongPress }) {
  let timer;

  const handlePointerDown = () => {
    timer = setTimeout(() => {
      if (onLongPress) onLongPress();
    }, 800);
  };

  const handlePointerUp = () => {
    clearTimeout(timer);
  };

  return (
    <div className="fab-container">
      <button 
        className="nana-fab" 
        onClick={onClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <span className="fab-icon">🎎</span>
      </button>
    </div>
  );
}
