import { useState } from 'react';
import { AlertCircle, X, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const EmailVerificationBanner = () => {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [isResending, setIsResending] = useState(false);

  // Don't show banner if email is verified or user dismissed it
  if (!user || user.isEmailVerified || !isVisible) {
    return null;
  }

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      await api.post('/auth/resend-verification');
      toast.success('Verification email sent! Please check your inbox.');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send verification email';
      toast.error(message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1">
            <AlertCircle className="w-5 h-5 text-yellow-400 mr-3" />
            <div className="flex-1">
              <p className="text-sm text-yellow-800">
                <span className="font-medium">Email not verified.</span> Please check your inbox and verify your email address to access all features.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 ml-4">
            <button
              onClick={handleResendVerification}
              disabled={isResending}
              className="flex items-center gap-1 px-3 py-1.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Mail className="w-4 h-4" />
              {isResending ? 'Sending...' : 'Resend Email'}
            </button>
            
            <button
              onClick={() => setIsVisible(false)}
              className="text-yellow-800 hover:text-yellow-900"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
