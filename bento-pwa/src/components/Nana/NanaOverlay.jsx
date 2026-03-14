import React, { useState, useEffect, useRef } from 'react';
import { Mic, Send, X, Cloud, AlertCircle } from 'lucide-react';
import './NanaOverlay.css';

export default function NanaOverlay({ 
  isVisible, 
  onClose, 
  statusText = '¿Dime BACHAN / どしたの?',
  aiResponse = '',
  nanaState = 'IDLE', // IDLE, THINKING, SYNCING, SPEAKING, ERROR
  onSendMessage
}) {
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

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
        onSendMessage(transcript);
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
  }, [onSendMessage]);

  if (!isVisible) return null;

  const handleMicClick = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const isThinking = nanaState === 'THINKING' || nanaState === 'SYNCING';
  const isError = nanaState === 'ERROR';

  return (
    <div className={`nana-overlay ${isVisible ? 'visible' : ''} ${isError ? 'error' : ''}`}>
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
          {isError ? '¡UPA! SE ME FUE LA ONDA...' : (isListening ? 'BACHAN ESCUCHANDO...' : statusText)}
        </h2>

        {aiResponse ? (
          <div className={`response-container ${isError ? 'response-error' : ''}`}>
            <p className="response-text">{aiResponse}</p>
          </div>
        ) : (
          isThinking && (
            <div className="thinking-dots">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          )
        )}

        <div className="input-group">
          {!isListening && !isThinking && (
            <div className="text-input-wrapper">
              <input 
                type="text" 
                placeholder="Escribe o pulsa el micro..." 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="nana-input"
              />
              <button className="send-btn" onClick={handleSend}>
                <Send size={18} />
              </button>
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
