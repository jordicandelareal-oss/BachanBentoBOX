import React, { useState, useRef } from 'react';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import { RotateCw, RotateCcw, Check, X, Sun, Contrast } from 'lucide-react';
import './ImageEditorModal.css';

/**
 * ImageEditorModal - A basic photo editor with crop, rotate, brightness, and contrast.
 * @param {string} image - The source image as a data URL or blob URL.
 * @param {function} onSave - Callback receiving the final edited Blob.
 * @param {function} onCancel - Callback to close the modal.
 */
export default function ImageEditorModal({ image, onSave, onCancel }) {
  const cropperRef = useRef(null);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const rotateLeft = () => {
    const cropper = cropperRef.current?.cropper;
    if (cropper) cropper.rotate(-90);
  };

  const rotateRight = () => {
    const cropper = cropperRef.current?.cropper;
    if (cropper) cropper.rotate(90);
  };

  const handleApply = async () => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;

    setIsProcessing(true);

    try {
      // 1. Get the cropped canvas
      const croppedCanvas = cropper.getCroppedCanvas({
        maxWidth: 1024,
        maxHeight: 1024,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
      });

      // 2. Create a temporary canvas to apply filters
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = croppedCanvas.width;
      finalCanvas.height = croppedCanvas.height;
      const ctx = finalCanvas.getContext('2d');

      // 3. Apply Brightness and Contrast filters using native Canvas API
      // Slider values are -100 to 100. Filter expects percentages where 100% is normal.
      const bValue = 100 + brightness;
      const cValue = 100 + contrast;
      ctx.filter = `brightness(${bValue}%) contrast(${cValue}%)`;
      
      // 4. Draw the cropped image onto the final canvas with filters
      ctx.drawImage(croppedCanvas, 0, 0);

      // 5. Export as Blob and return
      finalCanvas.toBlob((blob) => {
        setIsProcessing(false);
        if (blob) onSave(blob);
      }, 'image/jpeg', 0.85);

    } catch (err) {
      console.error('Error processing image:', err);
      setIsProcessing(false);
      alert('Error al procesar la imagen');
    }
  };

  return (
    <div className="image-editor-backdrop fade-in">
      <div className="image-editor-header">
        <h2 className="image-editor-title">Editar Foto</h2>
        <button onClick={onCancel} className="p-2 opacity-60 hover:opacity-100">
          <X size={24} />
        </button>
      </div>

      <div className="image-editor-body">
        <div className="cropper-container-wrapper shadow-2xl">
          <Cropper
            src={image}
            style={{ height: '100%', width: '100%' }}
            initialAspectRatio={1}
            aspectRatio={1}
            guides={true}
            ref={cropperRef}
            viewMode={1}
            dragMode="move"
            autoCropArea={1}
            background={false}
            responsive={true}
            checkOrientation={false} // Prevents weird jumps
          />
          {isProcessing && (
            <div className="editor-processing-overlay">
              <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin mb-3" />
              <span className="text-xs font-black uppercase tracking-widest text-white/60">Procesando...</span>
            </div>
          )}
        </div>

        <div className="editor-controls">
          <div className="rotation-controls">
            <button onClick={rotateLeft} className="rotate-btn">
              <RotateCcw size={18} /> 90° Izq
            </button>
            <button onClick={rotateRight} className="rotate-btn">
              <RotateCw size={18} /> 90° Der
            </button>
          </div>

          <div className="control-group">
            <div className="control-label-wrapper">
              <span className="control-label flex items-center gap-2">
                <Sun size={14} /> Brillo
              </span>
              <span className="control-value">{brightness > 0 ? '+' : ''}{brightness}%</span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="editor-slider"
            />
          </div>

          <div className="control-group">
            <div className="control-label-wrapper">
              <span className="control-label flex items-center gap-2">
                <Contrast size={14} /> Contraste
              </span>
              <span className="control-value">{contrast > 0 ? '+' : ''}{contrast}%</span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
              className="editor-slider"
            />
          </div>
        </div>
      </div>

      <div className="image-editor-footer">
        <button onClick={onCancel} className="editor-btn-cancel">Cancelar</button>
        <button onClick={handleApply} className="editor-btn-apply" disabled={isProcessing}>
          {!isProcessing && <Check size={20} />}
          <span>Aplicar y Subir</span>
        </button>
      </div>
    </div>
  );
}
