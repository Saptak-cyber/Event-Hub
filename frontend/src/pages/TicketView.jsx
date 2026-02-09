import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { Download, Calendar, MapPin, User, Mail, Ticket } from 'lucide-react';
import toast from 'react-hot-toast';

const TicketView = () => {
  const { registrationId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTicket();
  }, [registrationId]);

  const fetchTicket = async () => {
    try {
      // Get registration details
      const regResponse = await api.get(`/registrations/${registrationId}`);
      const registration = regResponse.data.data;

      if (registration.status !== 'confirmed') {
        setError('Ticket is only available for confirmed registrations');
        setLoading(false);
        return;
      }

      // Get QR code
      const qrResponse = await api.get(`/registrations/${registrationId}/qrcode`);
      
      setTicket({
        ...registration,
        qrCode: qrResponse.data.data.qrCode,
        ticketNumber: qrResponse.data.data.ticketNumber
      });
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load ticket');
      setLoading(false);
    }
  };

  const downloadTicket = () => {
    // Create a printable version
    window.print();
  };

  const addToCalendar = async () => {
    try {      const { data: userData } = await api.get('/auth/me');
      
      if (!userData.data.googleCalendarTokens) {
        const { data: authData } = await api.get('/auth/google/url');
        window.open(authData.authUrl, '_blank');
        toast.info('Please complete Google Calendar authorization in the new window');
        return;
      }
  
      await api.post(`/registrations/${registrationId}/add-to-calendar`);
      toast.success('Event added to Google Calendar!');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to add to calendar';
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-card rounded-2xl shadow-xl p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-destructive/20 mb-4">
            <svg className="h-10 w-10 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Actions */}
        <div className="mb-6 flex gap-4 print:hidden">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 bg-card text-foreground py-3 px-4 rounded-lg hover:bg-accent transition-colors shadow"
          >
            Back to Dashboard
          </button>
          <button
            onClick={downloadTicket}
            className="flex items-center gap-2 bg-primary text-primary-foreground py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors shadow"
          >
            <Download className="w-5 h-5" />
            Download
          </button>
          <button
            onClick={addToCalendar}
            className="flex items-center gap-2 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors shadow"
          >
            <Calendar className="w-5 h-5" />
            Add to Calendar
          </button>
        </div>

        {/* Ticket */}
        <div className="bg-card rounded-2xl shadow-2xl overflow-hidden border border-border">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-8">
            <div className="flex items-center gap-2 mb-4">
              <Ticket className="w-6 h-6" />
              <span className="font-mono text-sm opacity-90">{ticket.ticketNumber}</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">{ticket.event.title}</h1>
            <div className="flex items-center gap-2 text-purple-100">
              <Calendar className="w-4 h-4" />
              <span>{new Date(ticket.event.dateTime).toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Event Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg mb-4">Event Details</h3>
                
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="text-foreground">{ticket.event.location}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Attendee</p>
                    <p className="text-foreground">{ticket.user.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="text-foreground">{ticket.user.email}</p>
                  </div>
                </div>

                {ticket.amount > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-500">Amount Paid</p>
                    <p className="text-2xl font-bold text-purple-600">₹{ticket.amount}</p>
                  </div>
                )}
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center justify-center">
                <div className="bg-background p-4 rounded-xl border-4 border-primary/20">
                  <img 
                    src={ticket.qrCode} 
                    alt="Ticket QR Code"
                    className="w-48 h-48"
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Show this QR code at the venue for check-in
                </p>
              </div>
            </div>

            {/* Important Info */}
            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-900 mb-2">Important Information</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Please arrive 15 minutes before the event starts</li>
                <li>• Bring a valid ID for verification</li>
                <li>• This ticket is non-transferable</li>
                <li>• QR code will be scanned at the venue</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-muted px-8 py-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Registered on {new Date(ticket.registeredAt).toLocaleDateString()} | Event Management System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketView;
