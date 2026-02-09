import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import api from '../utils/api';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    try {
      const response = await api.get(`/auth/verify-email/${token}`);
      setStatus('success');
      setMessage(response.data.message || 'Email verified successfully!');
      setTimeout(() => navigate('/login'), 3000);
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.message || 'Verification failed. Token may be invalid or expired.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background -z-10" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="border-2">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              {status === 'loading' && (
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <Loader className="w-8 h-8 text-primary animate-spin" />
                </div>
              )}
              {status === 'success' && (
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              )}
              {status === 'error' && (
                <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-destructive" />
                </div>
              )}
            </div>
            <CardTitle className="text-3xl font-bold text-center">
              {status === 'loading' && 'Verifying Email'}
              {status === 'success' && 'Verification Successful'}
              {status === 'error' && 'Verification Failed'}
            </CardTitle>
            <CardDescription className="text-center">
              {message || 'Please wait while we verify your email...'}
            </CardDescription>
          </CardHeader>

          {status !== 'loading' && (
            <CardContent>
              <Button
                onClick={() => navigate(status === 'success' ? '/login' : '/')}
                className="w-full"
                size="lg"
              >
                {status === 'success' ? 'Go to Login' : 'Go to Home'}
              </Button>
            </CardContent>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
