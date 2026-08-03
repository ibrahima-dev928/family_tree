import { useEffect, useState } from 'react';
import AppRouter from './router/AppRouter';

function App() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === 'accepted') {
        console.log('App installée !');
      }
      setDeferredPrompt(null);
    }
  };

  return (
    <>
      <AppRouter />
      {deferredPrompt && (
        <button
          onClick={handleInstall}
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 24px',
            background: '#7a8b7f',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            zIndex: 9999,
            fontSize: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          }}
        >
          Installer l'application
        </button>
      )}
    </>
  );
}

export default App;