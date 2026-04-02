import React, { useEffect } from 'react';
import { Delete } from 'lucide-react';
import './NumPad.css';

/**
 * Custom NumPad component - bottom sheet style numeric keyboard.
 * Props:
 *   value        - current string value displayed
 *   onChange     - called with the new string value
 *   onClose      - called when user taps outside or Done
 *   label        - optional label shown above the value display
 *   allowDecimal - allow '.' input (default true)
 */
export default function NumPad({ value, onChange, onClose, label = '', allowDecimal = true }) {
  const display = value !== undefined && value !== null ? String(value) : '';

  // Close on Escape / back gesture
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleKey = (key) => {
    if (key === 'del') {
      onChange(display.slice(0, -1) || '0');
    } else if (key === '.') {
      if (!allowDecimal || display.includes('.')) return;
      onChange(display + '.');
    } else if (key === 'done') {
      onClose?.();
    } else {
      // digit
      const next = display === '0' ? key : display + key;
      onChange(next);
    }
  };

  const KEYS = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['.', '0', 'del'],
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="numpad-backdrop" onClick={onClose} />

      {/* Sheet */}
      <div className="numpad-sheet">
        {/* Preview bar */}
        <div className="numpad-preview">
          <span className="numpad-label">{label}</span>
          <div className="numpad-display">
            <span className="numpad-value">{display || '0'}</span>
          </div>
        </div>

        {/* Done bar */}
        <div className="numpad-done-row">
          <button className="numpad-done-btn" onClick={onClose}>Hecho ✓</button>
        </div>

        {/* Keys */}
        <div className="numpad-grid">
          {KEYS.map((row, ri) =>
            row.map((k) => (
              <button
                key={`${ri}-${k}`}
                className={`numpad-key ${k === 'del' ? 'del' : ''} ${k === 'done' ? 'done' : ''}`}
                onClick={() => handleKey(k)}
              >
                {k === 'del' ? <Delete size={20} /> : k}
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
}
