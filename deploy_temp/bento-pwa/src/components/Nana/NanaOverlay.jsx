import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Send, X, Cloud, AlertCircle, Camera } from 'lucide-react';
import Webcam from 'react-webcam';
import './NanaOverlay.css';

export default function NanaOverlay({ 
  isVisible, 
  onClose, 
  statusText = '¿Dime BACHAN / どしたの?',
  aiResponse = '',
  nanaState = 'IDLE', // IDLE, THINKING, SYNCING, SPEAKING, ERROR
  onSendMessage,
  initialVisionMode = false
}) {
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isVisionActive, setIsVisionActive] = useState(initialVisionMode);
  const webcamRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (isVisible) {
      setIsVisionActive(initialVisionMode);
    }
  }, [isVisible, initialVisionMode]);

  useEffect(() => {
    // Initialize Web Speech API if available
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'es-ES';
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        handleSend(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const handleMicClick = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleSend = useCallback((text = inputValue) => {
    const finalMessage = text || (isVisionActive ? "Identifica lo que ves en la imagen." : "");
    const trimmedMessage = typeof finalMessage === 'string' ? finalMessage.trim() : "";
    
    if (trimmedMessage || isVisionActive) {
      let imageBase64 = null;
      if (isVisionActive && webcamRef.current) {
        const screenshot = webcamRef.current.getScreenshot();
        if (screenshot) {
          imageBase64 = screenshot.split(',')[1];
        }
      }
      onSendMessage(trimmedMessage, imageBase64);
      setInputValue('');
    }
  }, [inputValue, isVisionActive, onSendMessage]);

  if (!isVisible) return null;

  const isThinking = nanaState === 'THINKING' || nanaState === 'SYNCING';
  const isError = nanaState === 'ERROR';

  return (
    <div className={`nana-overlay ${isVisible ? 'visible' : ''} ${isError ? 'error' : ''} ${isVisionActive ? 'vision-active' : ''}`}>
      <button className="close-btn" onClick={onClose}>
        <X size={24} />
      </button>

      <div className="overlay-content">
        <div className="avatar-container">
          <div className={`logo-border ${isThinking ? 'spinning' : ''} ${isError ? 'error-border' : ''}`}>
            <img 
              src="https://lh3.googleusercontent.com/d/14q-a9OMOQaHgjQ_Q-hMWM0e7UDA7YskL" 
              alt="Nana" 
              className="nana-avatar-img" 
            />
          </div>
          {nanaState === 'SYNCING' && (
            <div className="status-badge">
              <Cloud size={14} color="#fff" />
            </div>
          )}
          {isError && (
            <div className="status-badge error-bg">
              <AlertCircle size={14} color="#fff" />
            </div>
          )}
        </div>

        <h2 className={`status-text ${isError ? 'text-error' : ''}`}>
          {isError ? '¡UPA! SE ME FUE LA ONDA...' : (isListening ? 'BACHAN ESCUCHANDO...' : (isVisionActive ? 'NANA TE ESTÁ VIENDO...' : statusText))}
        </h2>

        <div className="center-display">
          {isVisionActive ? (
            <div className="camera-preview-container">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: "environment" }}
                className="nana-webcam"
              />
              <div className="camera-scan-line"></div>
            </div>
          ) : (
            aiResponse && (
              <div className={`response-container ${isError ? 'response-error' : ''}`}>
                <p className="response-text">{aiResponse}</p>
              </div>
            )
          )}
          
          {!isVisionActive && isThinking && !aiResponse && (
            <div className="thinking-dots">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          )}
        </div>

        <div className="input-group">
          {!isListening && !isThinking && (
            <div className="text-input-container">
              <button 
                className={`vision-toggle ${isVisionActive ? 'active' : ''}`}
                onClick={() => setIsVisionActive(!isVisionActive)}
                title="Activar Visión"
              >
                <Camera size={20} />
              </button>
              <div className="text-input-wrapper">
                <input 
                  type="text" 
                  placeholder={isVisionActive ? "Pregunta sobre lo que veo..." : "Escribe o pulsa el micro..."}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className="nana-input"
                />
                <button className="send-btn" onClick={() => handleSend()}>
                  <Send size={18} />
                </button>
              </div>
            </div>
          )}

          <div className="mic-wrapper">
            <button 
              className={`mic-btn ${isListening ? 'active' : ''}`}
              onClick={handleMicClick}
              disabled={isThinking}
            >
              <Mic size={32} />
            </button>
            <p className="mic-hint">
              {isListening ? 'TAP PARA DETENER' : 'PULSA PARA HABLAR'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
