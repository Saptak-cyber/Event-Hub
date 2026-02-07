import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, CheckCircle, Clock, XCircle, Mail, Phone, Download, QrCode, DollarSign, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { Html5QrcodeScanner } from 'html5-qrcode';

const EventRegistrations = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifiedData, setVerifiedData] = useState(null);
  const [refundingId, setRefundingId] = useState(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    if (!showScanner) {
      return;
    }

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: 250 },
      false
    );

    scanner.render(
      async (decodedText) => {
        setVerifyLoading(true);
        setScanResult(null);
        try {
          const { data } = await api.post('/registrations/verify-qr', {
            qrData: decodedText
          });
          setVerifiedData(data.data.registration);
          setScanResult({ type: 'success', message: 'Ticket verified successfully.' });
          await scanner.clear();
        } catch (error) {
          setVerifiedData(null);
          setScanResult({
            type: 'error',
            message: error.response?.data?.message || 'Failed to verify QR code'
          });
          await scanner.clear();
        } finally {
          setVerifyLoading(false);
        }
      },
      () => {}
    );

    scannerRef.current = scanner;

    return () => {
      scanner.clear().catch(() => {});
      scannerRef.current = null;
    };
  }, [showScanner]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch event details
      const eventResponse = await api.get(`/events/${id}`);
      setEvent(eventResponse.data.data);

      // Fetch registrations
      const regResponse = await api.get(`/registrations/event/${id}`);
      setRegistrations(regResponse.data.data);
    } catch (error) {
      toast.error('Failed to load data');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (registrationId) => {
    try {
      await api.put(`/registrations/${registrationId}/checkin`);
      toast.success('Attendee checked in successfully!');
      fetchData();
    } catch (error) {
      toast.error('Failed to check in attendee');
    }
  };

  const handleRefund = async (registrationId) => {
    if (!window.confirm('Refund this payment? This action cannot be undone.')) {
      return;
    }

    setRefundingId(registrationId);
    try {
      await api.post(`/payments/refund/${registrationId}`);
      toast.success('Payment refunded successfully');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to refund payment');
    } finally {
      setRefundingId(null);
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setVerifiedData(null);
    setShowScanner(false);
    setTimeout(() => setShowScanner(true), 0);
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Status', 'Registration Date', 'Check-in Status'];
    const rows = filteredRegistrations.map(reg => [
      reg.user.name,
      reg.user.email,
      reg.user.phone || 'N/A',
      reg.status,
      format(new Date(reg.registeredAt), 'PPP'),
      reg.checkInStatus ? 'Checked In' : 'Not Checked In'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event?.title}-registrations.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredRegistrations = registrations.filter(reg => {
    if (filter === 'all') return true;
    return reg.status === filter;
  });

  const stats = {
    total: registrations.length,
    confirmed: registrations.filter(r => r.status === 'confirmed').length,
    waitlist: registrations.filter(r => r.status === 'waitlist').length,
    cancelled: registrations.filter(r => r.status === 'cancelled').length,
    checkedIn: registrations.filter(r => r.checkInStatus).length
  };

  const statusColors = {
    confirmed: 'bg-green-100 text-green-800',
    waitlist: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>

        {/* Event Info */}
        <div className="card p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{event?.title}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>{format(new Date(event?.dateTime), 'PPP')}</span>
                <span>•</span>
                <span>{event?.location}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setScanResult(null);
                  setVerifiedData(null);
                  setShowScanner(true);
                }}
                className="btn-secondary flex items-center space-x-2"
              >
                <QrCode className="w-4 h-4" />
                <span>Scan QR</span>
              </button>
              <button
                onClick={exportToCSV}
                className="btn-primary flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-5 gap-4 mb-6">
          <div className="card p-4">
            <p className="text-sm text-gray-600 mb-1">Total Registrations</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-600 mb-1">Confirmed</p>
            <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-600 mb-1">Waitlist</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.waitlist}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-600 mb-1">Cancelled</p>
            <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-600 mb-1">Checked In</p>
            <p className="text-2xl font-bold text-blue-600">{stats.checkedIn}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {['all', 'confirmed', 'waitlist', 'cancelled'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                  filter === f
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f} {f !== 'all' && `(${registrations.filter(r => r.status === f).length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Registrations Table */}
        <div className="card overflow-hidden">
          {filteredRegistrations.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No registrations found
              </h3>
              <p className="text-gray-600">
                {filter === 'all' 
                  ? 'No one has registered yet' 
                  : `No ${filter} registrations`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registered
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Check-in
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRegistrations.map(registration => (
                    <tr key={registration._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <img
                              src={registration.user.avatar || 'https://ui-avatars.com/api/?name=' + registration.user.name}
                              alt={registration.user.name}
                              className="h-10 w-10 rounded-full"
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {registration.user.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center space-x-1">
                          <Mail className="w-3 h-3" />
                          <span>{registration.user.email}</span>
                        </div>
                        {registration.user.phone && (
                          <div className="text-sm text-gray-500 flex items-center space-x-1 mt-1">
                            <Phone className="w-3 h-3" />
                            <span>{registration.user.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`badge ${statusColors[registration.status]} capitalize`}>
                          {registration.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {registration.paymentStatus === 'completed' ? (
                          <div className="flex items-center gap-2 text-green-700">
                            <DollarSign className="w-4 h-4" />
                            <span className="text-sm font-medium">${registration.amount}</span>
                          </div>
                        ) : registration.paymentStatus === 'refunded' ? (
                          <span className="text-sm text-red-600">Refunded</span>
                        ) : registration.paymentStatus === 'pending' ? (
                          <span className="text-sm text-yellow-600">Pending</span>
                        ) : (
                          <span className="text-sm text-gray-500">Free</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(registration.registeredAt), 'PPP')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {registration.checkInStatus ? (
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="w-5 h-5 mr-1" />
                            <span className="text-sm">Checked In</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-gray-400">
                            <Clock className="w-5 h-5 mr-1" />
                            <span className="text-sm">Not Checked In</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-3">
                          {registration.status === 'confirmed' && !registration.checkInStatus && (
                            <button
                              onClick={() => handleCheckIn(registration._id)}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              Check In
                            </button>
                          )}
                          {registration.paymentStatus === 'completed' && (
                            <button
                              onClick={() => handleRefund(registration._id)}
                              disabled={refundingId === registration._id}
                              className="text-red-600 hover:text-red-900"
                            >
                              {refundingId === registration._id ? (
                                <span className="inline-flex items-center gap-1">
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                  Refunding
                                </span>
                              ) : (
                                'Refund'
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showScanner && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Scan Ticket QR</h2>
                  <p className="text-sm text-gray-500">Point the camera at the ticket QR code</p>
                </div>
                <button
                  onClick={() => setShowScanner(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div id="qr-reader" className="w-full"></div>
                  {verifyLoading && (
                    <div className="mt-3 text-sm text-gray-500">Verifying...</div>
                  )}
                  {scanResult && (
                    <div className={`mt-3 p-3 rounded-lg text-sm ${
                      scanResult.type === 'success'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {scanResult.message}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Verification Result</h3>
                  {verifiedData ? (
                    <div className="space-y-2 text-sm text-gray-700">
                      <p><span className="font-medium">Ticket:</span> {verifiedData.ticketNumber}</p>
                      <p><span className="font-medium">Attendee:</span> {verifiedData.user?.name}</p>
                      <p><span className="font-medium">Email:</span> {verifiedData.user?.email}</p>
                      <p><span className="font-medium">Event:</span> {verifiedData.event?.title}</p>
                      <p><span className="font-medium">Checked In:</span> {verifiedData.checkInStatus ? 'Yes' : 'No'}</p>

                      {!verifiedData.checkInStatus && (
                        <button
                          onClick={() => handleCheckIn(verifiedData.id)}
                          className="mt-2 w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700"
                        >
                          Check In Now
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Scan a ticket to see details.</p>
                  )}

                  <button
                    onClick={resetScanner}
                    className="mt-4 w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200"
                  >
                    Scan Another
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventRegistrations;

