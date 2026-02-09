import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { CheckCircle, XCircle } from 'lucide-react';

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('Connecting Google Calendar...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state'); // user ID

        if (!code || !state) {
          setStatus('error');
          setMessage('Invalid authorization response');
          setTimeout(() => window.close(), 3000);
          return;
        }

        // Send code to backend to save tokens
        const response = await api.get(`/auth/google/callback?code=${code}&state=${state}`);

        if (response.data.success) {
          setStatus('success');
          setMessage('Google Calendar connected successfully!');
          
          // Notify parent window if opened in popup
          if (window.opener) {
            window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, window.location.origin);
          }
          
          // Close window after 2 seconds
          setTimeout(() => {
            window.close();
          }, 2000);
        } else {
          throw new Error(response.data.message || 'Failed to connect Google Calendar');
        }
      } catch (error) {
        console.error('Google Calendar connection error:', error);
        setStatus('error');
        setMessage(error.response?.data?.message || 'Failed to connect Google Calendar');
        
        // Close window after 3 seconds
        setTimeout(() => window.close(), 3000);
      }
    };

    handleCallback();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-card rounded-2xl shadow-xl p-8 text-center">
        {status === 'loading' && (
          <>
            <LoadingSpinner />
            <p className="mt-4 text-muted-foreground">{message}</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-foreground">Success!</h2>
            <p className="text-muted-foreground mb-4">{message}</p>
            <p className="text-sm text-muted-foreground">This window will close automatically...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-destructive/20 mb-4">
              <XCircle className="h-10 w-10 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-foreground">Error</h2>
            <p className="text-muted-foreground mb-4">{message}</p>
            <p className="text-sm text-muted-foreground">This window will close automatically...</p>
            <button
              onClick={() => window.close()}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Close Window
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default GoogleCallback;
