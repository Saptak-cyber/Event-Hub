import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { Download, Calendar, MapPin, User, Mail, Ticket } from 'lucide-react';

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
    try {
      await api.post(`/registrations/${registrationId}/add-to-calendar`);
      alert('Event added to your Google Calendar!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add to calendar');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <svg className="h-10 w-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Actions */}
        <div className="mb-6 flex gap-4 print:hidden">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 bg-white text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors shadow"
          >
            Back to Dashboard
          </button>
          <button
            onClick={downloadTicket}
            className="flex items-center gap-2 bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors shadow"
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
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
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
                <h3 className="font-semibold text-gray-900 text-lg mb-4">Event Details</h3>
                
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="text-gray-900">{ticket.event.location}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Attendee</p>
                    <p className="text-gray-900">{ticket.user.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-gray-900">{ticket.user.email}</p>
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
                <div className="bg-white p-4 rounded-xl border-4 border-purple-200">
                  <img 
                    src={ticket.qrCode} 
                    alt="Ticket QR Code"
                    className="w-48 h-48"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-4 text-center">
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
          <div className="bg-gray-50 px-8 py-4 border-t">
            <p className="text-xs text-gray-500 text-center">
              Registered on {new Date(ticket.registeredAt).toLocaleDateString()} | Event Management System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketView;
