import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, Loader2, Lock } from 'lucide-react';

export default function AdminSetup() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Esperando validación...');
  const [inputValue, setInputValue] = useState('');
  const [isValidated, setIsValidated] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const key = searchParams.get('key');
    if (key) {
      validateKey(key);
    }
  }, [searchParams]);

  const validateKey = (keyToTest) => {
    setIsProcessing(true);
    if (keyToTest.trim() === 'BachAn_Master_2026_Secure') {
      localStorage.setItem('bachan_admin_token', keyToTest.trim());
      setStatus('✅ Dispositivo Validado. Acceso Maestro concedido.');
      setIsValidated(true);
      setTimeout(() => {
        window.location.href = '/'; 
      }, 1500);
    } else {
      setStatus('❌ Llave de acceso inválida. Inténtalo de nuevo.');
      setIsProcessing(false);
      setInputValue('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    validateKey(inputValue);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: 'var(--color-navy)',
      color: 'white',
      textAlign: 'center',
      padding: '20px'
    }}>
      {isValidated ? (
        <ShieldCheck size={64} color="var(--color-success)" style={{ marginBottom: '20px' }} />
      ) : isProcessing ? (
        <Loader2 size={64} color="var(--color-accent)" style={{ marginBottom: '20px', animation: 'spin 2s linear infinite' }} />
      ) : (
        <Lock size={64} color="var(--color-crema)" style={{ marginBottom: '20px' }} />
      )}
      
      <h2 style={{ fontFamily: 'var(--font-brand)', marginBottom: '10px' }}>Acceso Maestro VIP</h2>
      <p style={{ color: 'var(--color-crema)', marginBottom: '24px' }}>{status}</p>
      
      {!isValidated && !isProcessing && (
        <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '300px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input
            type="password"
            placeholder="Clave Maestra"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            style={{
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: '#111',
              border: '1px solid #333',
              color: '#fff',
              textAlign: 'center',
              fontSize: '16px',
              width: '100%'
            }}
          />
          <button
            type="submit"
            style={{
              padding: '16px',
              backgroundColor: 'var(--color-crema)',
              color: '#000',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            VALIDAR
          </button>
        </form>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
