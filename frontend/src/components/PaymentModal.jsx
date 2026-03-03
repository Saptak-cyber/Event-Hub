import { useState, useEffect } from 'react';
import api from '../utils/api';

// Load Razorpay script dynamically
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

const PaymentModal = ({ eventId, eventTitle, amount, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Load Razorpay script when component mounts
    loadRazorpayScript().then((loaded) => {
      setScriptLoaded(loaded);
      if (!loaded) {
        setError('Failed to load payment gateway. Please check your internet connection.');
      }
    });
  }, []);

  const handlePayment = async () => {
    if (!scriptLoaded) {
      setError('Payment gateway not loaded. Please refresh and try again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create order on backend
      const { data } = await api.post(`/payments/create-intent/${eventId}`);
      const { orderId, amount: orderAmount, currency, keyId } = data.data;

      // Get user info from localStorage or context
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : {};

      const options = {
        key: keyId,
        amount: orderAmount * 100, // Amount in paise
        currency: currency,
        name: 'Event Management',
        description: `Registration for ${eventTitle}`,
        order_id: orderId,
        prefill: {
          name: user.name || '',
          email: user.email || '',
        },
        theme: {
          color: '#3B82F6',
        },
        handler: async function (response) {
          try {
            // Verify payment on backend
            await api.post('/payments/confirm', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              eventId: eventId,
            });

            onSuccess();
          } catch (err) {
            setError(err.response?.data?.message || 'Payment verification failed');
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setError('Payment cancelled');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', function (response) {
        setError(response.error.description || 'Payment failed');
        setLoading(false);
      });

      rzp.open();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate payment');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-2xl shadow-xl max-w-md w-full p-8 border border-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Complete Payment</h2>
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{eventTitle}</h3>
            <p className="text-2xl font-bold text-primary">₹{amount}</p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              <strong>Note:</strong> You will be redirected to a secure Razorpay payment page.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-200 text-foreground py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePayment}
              disabled={loading || !scriptLoaded}
              className="flex-1 bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : `Pay ₹${amount}`}
            </button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Test card: 4111 1111 1111 1111 | CVV: Any 3 digits | Expiry: Any future date
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
