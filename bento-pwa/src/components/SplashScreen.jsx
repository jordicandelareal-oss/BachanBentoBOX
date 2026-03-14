import React, { useEffect, useState, useRef } from 'react';
import './SplashScreen.css';

const AUDIO_TRIGGER_MS = 1200; // Sincronizado con la App nativa

export default function SplashScreen({ onFinish }) {
  const [isExiting, setIsExiting] = useState(false);
  const [interactionRegistered, setInteractionRegistered] = useState(false);
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const hasTriggeredAudio = useRef(false);

  useEffect(() => {
    // Intentar autoplay silenciado por si acaso
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {
        console.log("Autoplay silenciado bloqueado, esperando interacción");
      });
    }

    // Fallback de seguridad si algo falla
    const timer = setTimeout(() => {
      handleFinish();
    }, 7000);

    return () => clearTimeout(timer);
  }, []);

  const handleTimeUpdate = () => {
    if (!hasTriggeredAudio.current && videoRef.current && videoRef.current.currentTime * 1000 >= AUDIO_TRIGGER_MS) {
      hasTriggeredAudio.current = true;
      if (audioRef.current) {
        audioRef.current.play().catch(e => {
          console.warn("Audio play failed (waiting for interaction):", e);
        });
      }
    }
  };

  const handleInteraction = () => {
    if (interactionRegistered) return;
    setInteractionRegistered(true);
    
    // Activar sonido y video al primer toque
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.play().catch(e => console.warn("Video failed:", e));
    }
    if (audioRef.current && hasTriggeredAudio.current) {
      audioRef.current.play().catch(e => console.warn("Audio failed:", e));
    }
  };

  const handleFinish = () => {
    setIsExiting(true);
    setTimeout(() => {
      onFinish();
    }, 800); 
  };

  return (
    <div 
      className={`splash-container ${isExiting ? 'exit' : ''}`}
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
    >
      {/* Overlay invisible para capturar la primera interacción */}
      {!interactionRegistered && <div className="silent-interaction-overlay" />}

      <video
        ref={videoRef}
        playsInline
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleFinish}
        className="splash-video"
      >
        <source src="/nana-intro.mp4" type="video/mp4" />
      </video>
      
      <audio 
        ref={audioRef} 
        src="/nana-voice.mp3" 
        preload="auto"
      />

      <div className="splash-overlay">
        <h1 className="splash-title">BACHAN BENTO BOX</h1>
        <p className="splash-subtitle">Cocinando con Inteligencia</p>
      </div>
    </div>
  );
}
