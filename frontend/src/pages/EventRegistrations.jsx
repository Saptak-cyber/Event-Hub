import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, CheckCircle, Clock, XCircle, Mail, Phone, Download, QrCode, DollarSign, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import api from '../utils/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { Dialog } from '../components/ui/Dialog';
import { cn } from '../lib/utils';
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
      const eventResponse = await api.get(`/events/${id}`);
      setEvent(eventResponse.data.data);

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
    toast.success('CSV exported successfully');
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
    confirmed: 'bg-green-500/10 text-green-500 border-green-500/20',
    waitlist: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    cancelled: 'bg-destructive/10 text-destructive border-destructive/20'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-32 mb-6" />
          <div className="grid md:grid-cols-5 gap-4 mb-6">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ x: -4 }}
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </motion.button>

        {/* Event Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{event?.title}</h1>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>{format(new Date(event?.dateTime), 'PPP')}</span>
                  <span>•</span>
                  <span>{event?.location}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setScanResult(null);
                    setVerifiedData(null);
                    setShowScanner(true);
                  }}
                  className="flex items-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  Scan QR
                </Button>
                <Button
                  onClick={exportToCSV}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Stats */}
        <div className="grid md:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Total', value: stats.total, color: 'text-primary' },
            { label: 'Confirmed', value: stats.confirmed, color: 'text-green-500' },
            { label: 'Waitlist', value: stats.waitlist, color: 'text-yellow-500' },
            { label: 'Cancelled', value: stats.cancelled, color: 'text-destructive' },
            { label: 'Checked In', value: stats.checkedIn, color: 'text-blue-500' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <Card className="p-4">
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-4 mb-6">
            <div className="flex flex-wrap gap-2">
              {['all', 'confirmed', 'waitlist', 'cancelled'].map(f => (
                <Button
                  key={f}
                  onClick={() => setFilter(f)}
                  variant={filter === f ? "default" : "secondary"}
                  className="capitalize"
                >
                  {f} {f !== 'all' && `(${registrations.filter(r => r.status === f).length})`}
                </Button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Registrations Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="overflow-hidden">
            {filteredRegistrations.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  No registrations found
                </h3>
                <p className="text-muted-foreground">
                  {filter === 'all' 
                    ? 'No one has registered yet' 
                    : `No ${filter} registrations`}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      {['Attendee', 'Contact', 'Status', 'Payment', 'Registered', 'Check-in', 'Actions'].map(header => (
                        <th key={header} className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredRegistrations.map((registration, index) => (
                      <motion.tr
                        key={registration._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.02 }}
                        className="hover:bg-muted/30 transition-colors"
                      >
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
                              <div className="text-sm font-medium">
                                {registration.user.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm flex items-center gap-1">
                            <Mail className="w-3 h-3 text-muted-foreground" />
                            <span>{registration.user.email}</span>
                          </div>
                          {registration.user.phone && (
                            <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <Phone className="w-3 h-3" />
                              <span>{registration.user.phone}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={cn("border capitalize", statusColors[registration.status])}>
                            {registration.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {registration.paymentStatus === 'completed' ? (
                            <div className="flex items-center gap-2 text-green-500">
                              <DollarSign className="w-4 h-4" />
                              <span className="text-sm font-medium">${registration.amount}</span>
                            </div>
                          ) : registration.paymentStatus === 'refunded' ? (
                            <span className="text-sm text-destructive">Refunded</span>
                          ) : registration.paymentStatus === 'pending' ? (
                            <span className="text-sm text-yellow-500">Pending</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">Free</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {format(new Date(registration.registeredAt), 'PPP')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {registration.checkInStatus ? (
                            <div className="flex items-center text-green-500">
                              <CheckCircle className="w-5 h-5 mr-1" />
                              <span className="text-sm">Checked In</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-muted-foreground">
                              <Clock className="w-5 h-5 mr-1" />
                              <span className="text-sm">Not Checked In</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-3">
                            {registration.status === 'confirmed' && !registration.checkInStatus && (
                              <Button
                                onClick={() => handleCheckIn(registration._id)}
                                variant="secondary"
                                size="sm"
                              >
                                Check In
                              </Button>
                            )}
                            {registration.paymentStatus === 'completed' && (
                              <Button
                                onClick={() => handleRefund(registration._id)}
                                disabled={refundingId === registration._id}
                                variant="destructive"
                                size="sm"
                              >
                                {refundingId === registration._id ? (
                                  <span className="flex items-center gap-1">
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Refunding
                                  </span>
                                ) : (
                                  'Refund'
                                )}
                              </Button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </motion.div>

        {showScanner && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="max-w-2xl w-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold">Scan Ticket QR</h2>
                    <p className="text-sm text-muted-foreground">Point the camera at the ticket QR code</p>
                  </div>
                  <button
                    onClick={() => setShowScanner(false)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div id="qr-reader" className="w-full"></div>
                    {verifyLoading && (
                      <div className="mt-3 text-sm text-muted-foreground">Verifying...</div>
                    )}
                    {scanResult && (
                      <div className={cn(
                        "mt-3 p-3 rounded-lg text-sm border",
                        scanResult.type === 'success'
                          ? 'bg-green-500/10 text-green-500 border-green-500/20'
                          : 'bg-destructive/10 text-destructive border-destructive/20'
                      )}>
                        {scanResult.message}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold mb-2">Verification Result</h3>
                    {verifiedData ? (
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Ticket:</span> {verifiedData.ticketNumber}</p>
                        <p><span className="font-medium">Attendee:</span> {verifiedData.user?.name}</p>
                        <p><span className="font-medium">Email:</span> {verifiedData.user?.email}</p>
                        <p><span className="font-medium">Event:</span> {verifiedData.event?.title}</p>
                        <p><span className="font-medium">Checked In:</span> {verifiedData.checkInStatus ? 'Yes' : 'No'}</p>

                        {!verifiedData.checkInStatus && (
                          <Button
                            onClick={() => handleCheckIn(verifiedData.id)}
                            className="mt-2 w-full"
                          >
                            Check In Now
                          </Button>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Scan a ticket to see details.</p>
                    )}

                    <Button
                      onClick={resetScanner}
                      variant="secondary"
                      className="mt-4 w-full"
                    >
                      Scan Another
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventRegistrations;

